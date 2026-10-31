import { useSyncExternalStore } from "react";
import { PARTNER_API } from "@/lib/env";
import { acresOf, formatAcres } from "./personalise";
import { KaEzyAskError, wait, type KaEzyChatService, type KaEzyService, type PayResult } from "./service";
import { demo, isVideo, newId, setOwner, type Conversation, type FarmRecord, type KaEzyVideo, type Message, type Tab } from "./store";

// "Try Ka-Ezy" signed in: the visitor signs in with an organisation's code
// and their phone through the EzyAgric Partner API (ezy_assistant_api,
// docs/partner-api.md step 5), or arrives from a sign-in link the
// organisation made (step 3.6), and the demo's answers then come from the
// real Ka-Ezy with the visitor's own one-day user token. The browser talks to
// the API directly (it allows this site's origin); nothing secret is on the
// page, only the user's own token, kept on their device for the day.
//
// Without NEXT_PUBLIC_PARTNER_API none of this exists and the demo stays on
// its sample answers (or the guest endpoint, service.ts).

export const PARTNER_ENABLED = PARTNER_API !== "";

/** The signed-in visitor, as the API's 5.2 / 5.5 answer gives it. */
export type Session = {
  accessToken: string;
  /** ISO-8601; the token is dead after this. */
  expiresAt: string;
  phone: string;
  organisation: { name: string; orgCode: string; sandbox: boolean };
  /** Feature keys the organisation has turned on. */
  features: string[];
  /** The user's full name, once known. */
  name: string;
  /** How they signed in: an SMS code or a link. */
  via: "code" | "link";
  /** When (ms since epoch): a sign-in made moments ago is news, a stored one is not. */
  signedInAt: number;
};

/** True for a session opened on this page just now, not one restored from storage. */
export function isFresh(current: Session | null, withinMs = 15_000): boolean {
  return !!current && Date.now() - (current.signedInAt || 0) < withinMs;
}

/** What the API answered with when it refused. */
export class PartnerError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

// ── the session, on this device ──────────────────────────────────────────────

const KEY = "ezyagric:kaezy-partner:v1";
let session: Session | null | undefined;
const listeners = new Set<() => void>();

function isSession(value: unknown): value is Session {
  const s = value as Session | null;
  return (
    !!s &&
    typeof s.accessToken === "string" &&
    s.accessToken.startsWith("ezy_user_") &&
    typeof s.expiresAt === "string" &&
    typeof s.phone === "string" &&
    !!s.organisation &&
    typeof s.organisation.orgCode === "string" &&
    Array.isArray(s.features)
  );
}

function load(): Session | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (!isSession(saved)) return null;
    // Expired: forget it, so the card asks again instead of failing later.
    if (Date.parse(saved.expiresAt) <= Date.now()) return null;
    return saved;
  } catch {
    return null;
  }
}

function setSession(next: Session | null) {
  session = next;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(THREADS_KEY);
    }
  } catch {
    // Blocked storage: signed in until the page is left.
  }
  if (!next) knownThreads = null;
  // Signed out or ended: "Your farm", conversations and records go with it.
  setOwner(next?.phone ?? null);
  for (const listener of listeners) listener();
}

function getSession(): Session | null {
  if (session === undefined) {
    session = load();
    setOwner(session?.phone ?? null, true);
  }
  return session;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The signed-in visitor, or null. The server render sees null. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}

// ── the account: name, stage, usage and plan (5.3) ───────────────────────────

/** GET /v1/user: the signed-in user as the organisation sees them. */
export type Account = {
  phone: string;
  name: string;
  profile: { gender?: string | null; region?: string | null; district?: string | null; village?: string | null };
  organisation: { name: string; orgCode: string; sandbox: boolean };
  /** linked (registered with EzyAgric as a farmer), pending, or sandbox. */
  ezyagricAccount: "linked" | "pending" | "sandbox";
  /** awareness, onboarded, transacted or repeating (EzyAgric's CRM stages). */
  stage: string;
  usage: { month: string; requests: number; byFeature: Record<string, number>; hasRecords: boolean };
  subscription: {
    /** free, paid or none */
    type: string;
    /** active or exhausted */
    status: string;
    usagePercentage: number | null;
    expiresAt: string | null;
    monthsPaid: number | null;
    paidSubscriptions: number;
    freeEligible: boolean;
    payUrl: string;
  };
};

let account: Account | null = null;
let accountFor: string | null = null;
const accountListeners = new Set<() => void>();

function notifyAccount() {
  for (const listener of accountListeners) listener();
}

function parseAccount(raw: Record<string, unknown>): Account {
  const str = (value: unknown) => (typeof value === "string" ? value : "");
  const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);
  const org = (raw.organisation ?? {}) as Record<string, unknown>;
  const usage = (raw.usage ?? {}) as Record<string, unknown>;
  const sub = (raw.subscription ?? {}) as Record<string, unknown>;
  const profile = (raw.profile ?? {}) as Account["profile"];
  const byFeature: Record<string, number> = {};
  for (const [key, value] of Object.entries((usage.by_feature ?? {}) as Record<string, unknown>)) {
    if (typeof value === "number") byFeature[key] = value;
  }
  return {
    phone: str(raw.phone),
    name: str(raw.name).trim(),
    profile: { gender: profile.gender, region: profile.region, district: profile.district, village: profile.village },
    organisation: { name: str(org.name), orgCode: str(org.org_code), sandbox: !!org.sandbox },
    ezyagricAccount: raw.ezyagric_account === "linked" || raw.ezyagric_account === "sandbox" ? raw.ezyagric_account : "pending",
    stage: str(raw.stage) || "awareness",
    usage: { month: str(usage.month), requests: num(usage.requests) ?? 0, byFeature, hasRecords: !!usage.has_records },
    subscription: {
      type: str(sub.type) || "none",
      status: str(sub.status) || "active",
      usagePercentage: num(sub.usage_percentage),
      expiresAt: str(sub.expires_at) || null,
      monthsPaid: num(sub.months_paid),
      paidSubscriptions: num(sub.paid_subscriptions) ?? 0,
      freeEligible: !!sub.free_eligible,
      payUrl: str(sub.pay_url),
    },
  };
}

/**
 * "Your farm" from the user's account: their first name for the answers, always
 * (one person, one name across the page), and the district (or region) as the
 * location where they have not typed one.
 */
function prefillFarm(me: Account) {
  const firstName = me.name.split(/\s+/)[0] ?? "";
  if (firstName) demo.setAccountName(firstName);
  const place = (me.profile.district || me.profile.region || "").trim();
  if (place) demo.setProfileIfEmpty({ location: place });
}

/**
 * Re-read the account (after a sign-in, and after each answer, since usage
 * moves). A dead token clears the session. Best effort otherwise.
 */
export async function refreshAccount(): Promise<Account | null> {
  const current = getSession();
  if (!current) {
    if (account) {
      account = null;
      accountFor = null;
      notifyAccount();
    }
    return null;
  }
  try {
    const raw = await call<Record<string, unknown>>("/v1/user", { token: current.accessToken });
    account = parseAccount(raw);
    accountFor = current.accessToken;
    prefillFarm(account);
    notifyAccount();
    return account;
  } catch (error) {
    if (error instanceof PartnerError && error.status === 401) setSession(null);
    return null;
  }
}

function getAccount(): Account | null {
  const current = getSession();
  if (!current) return null;
  // Loaded once per session; the first reader starts it.
  if (accountFor !== current.accessToken && accountFor !== `loading:${current.accessToken}`) {
    accountFor = `loading:${current.accessToken}`;
    void refreshAccount();
    return null;
  }
  return accountFor === current.accessToken ? account : null;
}

function subscribeAccount(listener: () => void) {
  accountListeners.add(listener);
  listeners.add(listener); // a sign-out empties it too
  return () => {
    accountListeners.delete(listener);
    listeners.delete(listener);
  };
}

/** The signed-in user's account, once loaded; null before, or signed out. */
export function useAccount(): Account | null {
  return useSyncExternalStore(subscribeAccount, getAccount, () => null);
}

// ── the account's conversations (6.3, 6.4) ───────────────────────────────────

/** One of the user's conversations on the API, as 6.3 lists them. */
export type RemoteThread = {
  threadId: string;
  tab: Tab;
  title: string;
  valueChain: string | null;
  /** ms since epoch, from `updated_at` (else `created_at`, else now). */
  at: number;
  /** The farm details it was asked with, for "Your farm" on a new device. */
  location: string;
  acres: string;
};

const THREADS_PAGE = 100;
/** A runaway answer stops here; no real account comes near it. */
const MAX_THREADS = 1000;

let threads: RemoteThread[] | null = null;
let threadsFor: string | null = null;
const threadListeners = new Set<() => void>();

function notifyThreads() {
  for (const listener of threadListeners) listener();
}

function parseThread(raw: Record<string, unknown>): RemoteThread | null {
  const id = typeof raw.thread_id === "string" ? raw.thread_id : "";
  if (!id) return null;
  const when = [raw.updated_at, raw.created_at].find((v): v is string => typeof v === "string");
  const at = when ? Date.parse(when) : NaN;
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : "Conversation";
  return {
    threadId: id,
    tab: raw.kind === "farm_plan" ? "plan" : "expert",
    title: title.slice(0, 80),
    valueChain: typeof raw.value_chain === "string" ? raw.value_chain : null,
    at: Number.isFinite(at) ? at : Date.now(),
    location: typeof raw.location === "string" ? raw.location.trim() : "",
    acres: typeof raw.land_size_acres === "number" && raw.land_size_acres > 0 ? String(raw.land_size_acres) : "",
  };
}

/** Re-read the user's conversations from the API (after a sign-in, and after each answer). */
export async function refreshThreads(): Promise<RemoteThread[]> {
  const current = getSession();
  if (!current) {
    if (threads) {
      threads = null;
      threadsFor = null;
      notifyThreads();
    }
    return [];
  }
  try {
    // All of them, page by page (6.3).
    const raw: Record<string, unknown>[] = [];
    for (let offset = 0; offset < MAX_THREADS; offset += THREADS_PAGE) {
      const page = await call<Record<string, unknown>[]>(`/v1/farm-expert/threads?limit=${THREADS_PAGE}&offset=${offset}`, {
        token: current.accessToken,
      });
      const rows = Array.isArray(page) ? page : [];
      raw.push(...rows);
      if (rows.length < THREADS_PAGE) break;
    }
    // Signed out meanwhile: this answer is no one's now.
    if (getSession()?.accessToken !== current.accessToken) return [];
    threads = raw.map(parseThread).filter((t): t is RemoteThread => !!t);
    for (const thread of threads) rememberThread(thread.threadId);
    threadsFor = current.accessToken;
    notifyThreads();
    return threads;
  } catch (error) {
    if (error instanceof PartnerError && error.status === 401) setSession(null);
    return threads ?? [];
  }
}

function getThreads(): RemoteThread[] | null {
  const current = getSession();
  if (!current) return null;
  if (threadsFor !== current.accessToken && threadsFor !== `loading:${current.accessToken}`) {
    threadsFor = `loading:${current.accessToken}`;
    void refreshThreads();
    return null;
  }
  return threadsFor === current.accessToken ? threads : null;
}

function subscribeThreads(listener: () => void) {
  threadListeners.add(listener);
  listeners.add(listener); // a sign-out empties it too
  return () => {
    threadListeners.delete(listener);
    listeners.delete(listener);
  };
}

/** The signed-in user's conversations on the API, once loaded; null before, or signed out. */
export function useRemoteThreads(): RemoteThread[] | null {
  return useSyncExternalStore(subscribeThreads, getThreads, () => null);
}

/**
 * 6.4: one of the user's conversations, as the demo shows it. Its id is the
 * API's thread id, so a follow-up continues the same thread.
 */
export async function fetchConversation(thread: RemoteThread): Promise<Conversation> {
  const current = getSession();
  if (!current) throw new PartnerError(401, "signed_out", "");
  const out = await call<{ messages?: Record<string, unknown>[] }>(
    `/v1/farm-expert/threads/${encodeURIComponent(thread.threadId)}/messages`,
    { token: current.accessToken },
  );
  const messages: Message[] = [];
  for (const m of out.messages ?? []) {
    const text = typeof m.content === "string" ? m.content : "";
    if (!text.trim()) continue;
    if (m.role === "user") messages.push({ id: newId(), from: "you", text });
    else if (m.role === "assistant") {
      const video = parseVideo(m.video);
      messages.push(video ? { id: newId(), from: "kaezy", text, video } : { id: newId(), from: "kaezy", text });
    }
  }
  rememberThread(thread.threadId);
  return { id: `remote:${thread.threadId}`, tab: thread.tab, title: thread.title, at: thread.at, messages, threadId: thread.threadId };
}

// ── the account's farm records (8.2) ─────────────────────────────────────────

/** The user's records on the API, newest first, with totals over all of them. */
export type AccountRecords = {
  count: number;
  totals: { income: number; expenses: number; profit: number };
  records: (FarmRecord & { id: string })[];
};

const RECORDS_PAGE = 200;
const MAX_RECORDS = 2000;
let accountRecords: AccountRecords | null = null;
let recordsFor: string | null = null;
const recordListeners = new Set<() => void>();

function parseRecords(rows: Record<string, unknown>[]): AccountRecords["records"] {
  const out: AccountRecords["records"] = [];
  for (const row of rows) {
    const type = row.record_type;
    if (type !== "income" && type !== "expense" && type !== "activity") continue;
    out.push({
      id: String(row.id ?? out.length),
      type,
      category: typeof row.category === "string" ? row.category : "",
      description: typeof row.description === "string" ? row.description : "",
      amount: typeof row.amount_ugx === "number" ? row.amount_ugx : 0,
      date: typeof row.record_date === "string" ? row.record_date : "",
    });
  }
  return out;
}

/** Re-read the user's records (after a sign-in, and after saving some). */
export async function refreshRecords(): Promise<void> {
  const current = getSession();
  if (!current) return;
  try {
    type Out = { count?: number; totals?: { income_ugx?: number; expense_ugx?: number; net_ugx?: number }; records?: Record<string, unknown>[] };
    const rows: Record<string, unknown>[] = [];
    let first: Out | null = null;
    for (let offset = 0; offset < MAX_RECORDS; offset += RECORDS_PAGE) {
      const page = await call<Out>(`/v1/records?limit=${RECORDS_PAGE}&offset=${offset}`, { token: current.accessToken });
      first ??= page;
      const got = Array.isArray(page.records) ? page.records : [];
      rows.push(...got);
      if (got.length < RECORDS_PAGE || rows.length >= (page.count ?? 0)) break;
    }
    if (getSession()?.accessToken !== current.accessToken) return;
    accountRecords = {
      count: first?.count ?? rows.length,
      totals: {
        income: first?.totals?.income_ugx ?? 0,
        expenses: first?.totals?.expense_ugx ?? 0,
        profit: first?.totals?.net_ugx ?? 0,
      },
      records: parseRecords(rows),
    };
  } catch (error) {
    if (error instanceof PartnerError && error.status === 401) setSession(null);
    // Off for this organisation, or offline: the panel shows what it has.
  }
  recordsFor = current.accessToken;
  for (const listener of recordListeners) listener();
}

function getRecords(): AccountRecords | null {
  const current = getSession();
  if (!current) return null;
  if (recordsFor !== current.accessToken && recordsFor !== `loading:${current.accessToken}`) {
    recordsFor = `loading:${current.accessToken}`;
    accountRecords = null;
    void refreshRecords();
    return null;
  }
  return recordsFor === current.accessToken ? accountRecords : null;
}

function subscribeRecords(listener: () => void) {
  recordListeners.add(listener);
  listeners.add(listener); // a sign-out empties it too
  return () => {
    recordListeners.delete(listener);
    listeners.delete(listener);
  };
}

/** The signed-in user's records, once loaded; null before, or signed out. */
export function useAccountRecords(): AccountRecords | null {
  return useSyncExternalStore(subscribeRecords, getRecords, () => null);
}

// ── asking for the sign-in from elsewhere on the page ────────────────────────

const signInAskers = new Set<() => void>();

/** The hire card's "Sign in to pay here": the sign-in popup lives with the Ka-Ezy window. */
export function askSignIn() {
  for (const asker of signInAskers) asker();
}

export function onSignInAsked(asker: () => void) {
  signInAskers.add(asker);
  return () => {
    signInAskers.delete(asker);
  };
}

// ── arriving from a link ─────────────────────────────────────────────────────

/**
 * What the address bar carried on arrival (Partner API guide, 3.6):
 *   ?k=ezy_link_…      a sign-in link: the token is its only parameter
 * The page looks the token up (5.6) for the organisation and the masked
 * phone to show, and exchanges it (5.5) for a session. `linking` is true
 * until the exchange ends; `failure` says why it did not sign the visitor in
 * (used, expired, refused), so the card can say so and fall back to the SMS
 * code for the same organisation.
 *
 * Older links carried `org`, `phone` and `token` in the open; they are
 * still read, so links already sent keep working.
 */
export type Arrival = {
  /** The organisation code, from the lookup (or an older link). */
  org: string;
  orgName: string;
  /** The full phone, from an older link only; otherwise "". */
  phone: string;
  /** The phone masked, from the lookup: "256772•••456". */
  phoneMasked: string;
  /** A token was in the link. */
  fromToken: boolean;
  linking: boolean;
  failure: PartnerError | null;
};

let arrival: Arrival | null = null;
const arrivalListeners = new Set<() => void>();

function notifyArrival() {
  for (const listener of arrivalListeners) listener();
}

/** The token is single-use: drop it from the address bar and history once read. */
function forgetToken() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("k") && !url.searchParams.has("token")) return;
    url.searchParams.delete("k");
    url.searchParams.delete("token");
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    // The address bar keeps it; the token is spent anyway.
  }
}

type PeekOut = {
  status?: string;
  organisation?: { name?: string; org_code?: string | null };
  org_code?: string | null;
  phone_masked?: string;
};

function readArrival(): Arrival {
  if (arrival) return arrival;
  const params = new URLSearchParams(window.location.search);
  const clean = (value: string | null, max: number) => (value ?? "").trim().slice(0, max);
  const token = clean(params.get("k"), 200) || clean(params.get("token"), 200);
  arrival = {
    org: clean(params.get("org"), 40),
    orgName: "",
    phone: clean(params.get("phone"), 20),
    phoneMasked: "",
    fromToken: !!token,
    linking: false,
    failure: null,
  };
  if (!token) return arrival;
  forgetToken();
  if (getSession()) return arrival;
  arrival = { ...arrival, linking: true };
  const { org, phone } = arrival;
  // Who the link is for, to show at once and to keep for the fallback form.
  call<PeekOut>(`/v1/sign-in/link/${encodeURIComponent(token)}`)
    .then((peek) => {
      arrival = {
        ...(arrival as Arrival),
        org: peek.org_code || peek.organisation?.org_code || (arrival as Arrival).org,
        orgName: peek.organisation?.name || "",
        phoneMasked: peek.phone_masked || "",
      };
      notifyArrival();
    })
    .catch(() => {
      // The exchange below says what is wrong with the link.
    });
  signInWithLink(token, org, phone)
    .then(() => {
      arrival = { ...(arrival as Arrival), linking: false };
    })
    .catch((failure: unknown) => {
      arrival = {
        ...(arrival as Arrival),
        linking: false,
        failure: failure instanceof PartnerError ? failure : new PartnerError(0, "failed", ""),
      };
    })
    .finally(notifyArrival);
  return arrival;
}

function subscribeArrival(listener: () => void) {
  arrivalListeners.add(listener);
  return () => {
    arrivalListeners.delete(listener);
  };
}

/** The link the page was opened with, read once. The server render sees null. */
export function useArrival(): Arrival | null {
  return useSyncExternalStore(subscribeArrival, readArrival, () => null);
}

// ── calls ────────────────────────────────────────────────────────────────────

type Body = FormData | Record<string, unknown> | undefined;

/**
 * One request to the API. JSON in and out, or a FormData body (photos).
 * `timeoutMs` covers slow Ka-Ezy answers (the app allows 180 s). A refusal
 * becomes a PartnerError with the API's own code and message.
 */
async function call<T>(
  path: string,
  { method = "GET", body, token, signal, timeoutMs = 20_000 }: {
    method?: string;
    body?: Body;
    token?: string;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) onAbort();
  else signal?.addEventListener("abort", onAbort, { once: true });
  let response: Response;
  try {
    response = await fetch(`${PARTNER_API}${path}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      credentials: "omit",
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new PartnerError(0, controller.signal.aborted ? "timeout" : "offline", "");
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = (data as { detail?: { code?: unknown; message?: unknown } } | null)?.detail;
    const code = typeof detail?.code === "string" ? detail.code : `http_${response.status}`;
    const message = typeof detail?.message === "string" ? detail.message : "";
    throw new PartnerError(response.status, code, message);
  }
  return data as T;
}

type SessionOut = {
  access_token: string;
  expires_at: string;
  phone: string;
  organisation: { name: string; org_code: string | null; sandbox?: boolean };
  features: string[];
};

async function started(out: SessionOut, via: Session["via"], name: string): Promise<Session> {
  // Who the account says this is, before anyone is shown as signed in. The API
  // ignores a name typed by someone it already knows (5.2), so that name stands.
  let me: Account | null = null;
  try {
    me = parseAccount(await call<Record<string, unknown>>("/v1/user", { token: out.access_token }));
    account = me;
    accountFor = out.access_token;
  } catch {
    // The account's first reader asks again.
  }
  const next: Session = {
    accessToken: out.access_token,
    expiresAt: out.expires_at,
    phone: out.phone,
    organisation: { name: out.organisation.name, orgCode: out.organisation.org_code ?? "", sandbox: !!out.organisation.sandbox },
    features: out.features,
    name: me?.name || name.trim(),
    via,
    signedInAt: Date.now(),
  };
  setSession(next);
  if (me) {
    prefillFarm(me);
    notifyAccount();
  }
  return next;
}

/** 5.1: a code is texted to the phone (or, for a test organisation, is 123456). */
export async function requestCode(orgCode: string, phone: string): Promise<{ sandbox: boolean }> {
  const out = await call<{ sandbox?: boolean }>("/v1/sign-in/code", {
    method: "POST",
    body: { org_code: orgCode, phone },
  });
  return { sandbox: !!out.sandbox };
}

/** 5.2: the code, with the name and consent a new user must give. */
export async function signInWithCode(
  orgCode: string,
  phone: string,
  code: string,
  { name, termsVersion }: { name: string; termsVersion: string | null },
): Promise<Session> {
  const body: Record<string, unknown> = { org_code: orgCode, phone, code };
  if (name.trim()) body.name = name.trim();
  if (termsVersion) body.consent = { terms_version: termsVersion, source: "ezyagric.com checkbox" };
  const out = await call<SessionOut>("/v1/sign-in", { method: "POST", body });
  return started(out, "code", name);
}

/** 5.5: a sign-in link's token, with the org and phone the link showed. */
export async function signInWithLink(token: string, orgCode: string, phone: string): Promise<Session> {
  const body: Record<string, unknown> = { token };
  if (orgCode) body.org_code = orgCode;
  if (phone) body.phone = phone;
  const out = await call<SessionOut>("/v1/sign-in/link", { method: "POST", body });
  return started(out, "link", "");
}

/** 5.4, then forget the session here whatever the API said. */
export async function signOut(): Promise<void> {
  const current = getSession();
  account = null;
  accountFor = null;
  threads = null;
  threadsFor = null;
  accountRecords = null;
  recordsFor = null;
  plans = null;
  setSession(null);
  if (!current) return;
  try {
    await call("/v1/sign-out", { method: "POST", token: current.accessToken });
  } catch {
    // The token dies within the day anyway.
  }
}

// ── value chains ─────────────────────────────────────────────────────────────

type ValueChain = { key: string; name: string };
let chains: Promise<ValueChain[]> | null = null;

const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

/** "Your farm"'s name for a value chain the API named ("cucumber" -> "Cucumber", "matooke" -> "Banana/Matooke"); "" if it has none. */
export function valueChainLabel(groups: { items: string[] }[], apiName: string): string {
  const wanted = normalise(apiName);
  if (!wanted) return "";
  for (const { items } of groups) {
    const hit = items.find((item) => normalise(item) === wanted || item.split("/").map(normalise).includes(wanted));
    if (hit) return hit;
  }
  return "";
}

/**
 * The API's key for a value chain as "Your farm" names it ("Maize" ->
 * "maize", "Banana/Matooke" -> whichever of the two the API has). Null when
 * the API has no such value chain.
 */
async function valueChainKey(token: string, label: string): Promise<string | null> {
  chains ??= call<ValueChain[]>("/v1/value-chains", { token }).catch((error) => {
    chains = null;
    throw error;
  });
  const list = await chains;
  const wanted = label.split("/").map(normalise);
  for (const candidate of wanted) {
    const hit = list.find((chain) => normalise(chain.name) === candidate || normalise(chain.key) === candidate);
    if (hit) return hit.key;
  }
  return null;
}

// ── the answers ──────────────────────────────────────────────────────────────

// Threads the API gave us. The demo makes its own ids for conversations
// (store.ts); the API only continues threads it started, so a demo id is
// never sent: the first question of a conversation starts a thread, and the
// id that comes back is kept on the conversation (demo.setThread).
const THREADS_KEY = "ezyagric:kaezy-partner-threads:v1";
let knownThreads: Set<string> | null = null;

function serverThreads(): Set<string> {
  if (knownThreads) return knownThreads;
  try {
    const raw = window.localStorage.getItem(THREADS_KEY);
    const saved: unknown = raw ? JSON.parse(raw) : [];
    knownThreads = new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []);
  } catch {
    knownThreads = new Set();
  }
  return knownThreads;
}

function rememberThread(id: string) {
  const set = serverThreads();
  set.add(id);
  try {
    window.localStorage.setItem(THREADS_KEY, JSON.stringify([...set].slice(-50)));
  } catch {
    // Forgotten on reload: the next question starts a new thread.
  }
}

/** The API's refusal as the chat's reasons (service.ts). */
function askError(error: unknown): KaEzyAskError {
  if (!(error instanceof PartnerError)) return new KaEzyAskError("busy");
  if (error.status === 0) return new KaEzyAskError(error.code === "offline" ? "offline" : "busy");
  if (error.status === 401) {
    // The sign-in died: ask again rather than fail every question.
    setSession(null);
    return new KaEzyAskError("signedOut");
  }
  if (error.status === 402 || error.status === 429) return new KaEzyAskError("limit");
  if (error.code === "feature_not_enabled") return new KaEzyAskError("notEnabled");
  if (error.code === "unknown_value_chain" || error.code === "value_chain_is_group") {
    return new KaEzyAskError("unknownValueChain");
  }
  if (error.code === "user_blocked" || error.code === "account_suspended") {
    setSession(null);
    return new KaEzyAskError("signedOut");
  }
  return new KaEzyAskError("busy");
}

/**
 * Ka-Ezy's answers for a signed-in visitor: Farm Expert (6.2) for questions
 * and photo checks, Farm Plan (7.1) for the plan form. The value chain from
 * "Your farm" goes along as context when it is set; only a plan needs one.
 */
export function partnerChatService(current: Session): KaEzyChatService {
  const token = current.accessToken;
  return {
    async ask(question, signal, { mode = "chat", profile, threadId, photos = [] } = {}) {
      // The value chain is context, not a requirement: sent when "Your farm"
      // names one the API knows. A plan is the exception: it needs a crop.
      const label = profile?.valueChain ?? "";
      let key: string | null = null;
      if (label) {
        try {
          key = await valueChainKey(token, label);
        } catch (error) {
          throw askError(error);
        }
      }
      if (mode === "farm_plan" && !key) throw new KaEzyAskError("unknownValueChain");
      const acres = profile ? acresOf(profile) : null;
      const location = profile?.location.trim() || null;
      const name = profile?.name.trim() || null;
      try {
        if (mode === "farm_plan") {
          const form = parsePlan(question);
          const notes = [
            form.variety ? `Variety: ${form.variety}.` : "",
            form.start_date ? `Planting date: ${form.start_date}.` : "",
            form.priority_services.length ? `Services to budget for: ${form.priority_services.join(", ")}.` : "",
          ]
            .filter(Boolean)
            .join(" ");
          const out = await call<{ plan: string; thread_id: string; video?: unknown }>("/v1/farm-plan", {
            method: "POST",
            token,
            signal,
            timeoutMs: 180_000,
            body: {
              value_chain: key,
              location,
              land_size_acres: acres,
              user_name: name,
              notes: notes || null,
            },
          });
          rememberThread(out.thread_id);
          void refreshAccount();
          void refreshThreads();
          return { text: out.plan, threadId: out.thread_id, video: parseVideo(out.video) };
        }
        const body = new FormData();
        // A photo check sends the app's diagnosis form as the question; the API takes the words.
        body.set("question", mode === "diagnosis" ? diagnosisNotes(question) : question);
        if (key) body.set("value_chain", key);
        if (threadId && serverThreads().has(threadId)) body.set("thread_id", threadId);
        if (location) body.set("location", location);
        if (acres) body.set("land_size_acres", formatAcres(acres));
        if (name) body.set("user_name", name);
        for (const photo of photos) body.append("images", photo, "photo.jpg");
        const out = await call<{ answer: string; thread_id: string; video?: unknown }>("/v1/farm-expert/ask", {
          method: "POST",
          token,
          signal,
          timeoutMs: 180_000,
          body,
        });
        if (!out.answer?.trim()) throw new KaEzyAskError("busy");
        rememberThread(out.thread_id);
        void refreshAccount();
        void refreshThreads();
        return { text: out.answer, threadId: out.thread_id, video: parseVideo(out.video) };
      } catch (error) {
        if (error instanceof KaEzyAskError || signal.aborted) throw error;
        throw askError(error);
      }
    },
  };
}

/** The API's `video` as the thread shows it, or undefined when absent or odd. */
function parseVideo(raw: unknown): KaEzyVideo | undefined {
  const v = raw as { title?: unknown; url?: unknown; youtube_id?: unknown; source?: unknown } | null;
  if (!v) return undefined;
  const video = {
    title: typeof v.title === "string" ? v.title : "",
    url: typeof v.url === "string" ? v.url : "",
    youtubeId: typeof v.youtube_id === "string" ? v.youtube_id : "",
    source: typeof v.source === "string" ? v.source : "",
  };
  return isVideo(video) ? video : undefined;
}

function parsePlan(question: string): { variety: string; start_date: string; priority_services: string[] } {
  try {
    const form = JSON.parse(question) as Partial<{ variety: string; start_date: string; priority_services: string[] }>;
    return {
      variety: typeof form.variety === "string" ? form.variety : "",
      start_date: typeof form.start_date === "string" ? form.start_date : "",
      priority_services: Array.isArray(form.priority_services) ? form.priority_services.map(String) : [],
    };
  } catch {
    return { variety: "", start_date: "", priority_services: [] };
  }
}

function diagnosisNotes(question: string): string {
  try {
    const form = JSON.parse(question) as { notes?: unknown };
    return typeof form.notes === "string" && form.notes.trim() ? form.notes : question;
  } catch {
    return question;
  }
}

// ── buying a plan (12.1, 12.2, 12.4) ─────────────────────────────────────────

/** A Ka-Ezy plan as 12.1 lists it: the same catalogue and prices as the app. */
export type Plan = { id: string; name: string; months: number; amount: number; currency: string };

let plans: Promise<Plan[]> | null = null;

export async function listPlans(current: Session): Promise<Plan[]> {
  plans ??= call<Plan[]>("/v1/plans", { token: current.accessToken }).catch((error) => {
    plans = null;
    throw error;
  });
  return plans;
}

/** The payment system refused before any prompt was sent; `message` is its reason, for the visitor. */
export class PayRefused extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type PaymentOut = { payment_id: string; status: string; message?: string };

const POLL_EVERY_MS = 3000;
const POLL_FOR_MS = 180_000;

function refusal(error: unknown): PayRefused {
  if (error instanceof PartnerError) {
    if (error.status === 401) setSession(null);
    const text =
      error.message ||
      (error.status === 0
        ? "Unable to connect. Check your internet and try again."
        : "The payment could not be requested right now. Please try again shortly.");
    return new PayRefused(error.code, text);
  }
  return new PayRefused("failed", "The payment could not be requested right now. Please try again shortly.");
}

/**
 * The real thing, for a signed-in visitor: the plan for the chosen months
 * from 12.1, a Mobile Money prompt on their phone from 12.2, then 12.4
 * polled until it settles. The money and the plan are EzyAgric's payment
 * system's; this page only asks and watches. A new order reference per
 * attempt, so a retry never charges twice.
 *
 * In a sandbox organisation no prompt is sent: the preview's "what happens
 * next" switch settles the payment through 11.2 instead, so the whole flow
 * can be tried without a real phone.
 */
export function partnerPayService(current: Session): Pick<KaEzyService, "pay"> {
  const token = current.accessToken;
  return {
    async pay(request, { onStatus, signal, demoOutcome, onMessage }): Promise<PayResult> {
      onStatus("sending");
      let payment: PaymentOut;
      try {
        const catalogue = await listPlans(current);
        const plan = catalogue.find((p) => p.months === request.months);
        if (!plan) throw new PayRefused("unknown_plan", "That plan is not on sale right now. Choose another.");
        const reference = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        payment = await call<PaymentOut>("/v1/payments", {
          method: "POST",
          token,
          signal,
          timeoutMs: 40_000,
          body: { plan_id: plan.id, order_reference: reference },
        });
      } catch (error) {
        if (error instanceof PayRefused || signal.aborted) throw error;
        throw refusal(error);
      }
      onStatus("instructions_sent");
      if (payment.message) onMessage?.(payment.message);

      // Sandbox: play the phone, as the preview's switch says.
      if (current.organisation.sandbox && demoOutcome) {
        await wait(1500, signal);
        const status = demoOutcome === "approved" ? "successful" : demoOutcome === "declined" ? "failed" : "expired";
        try {
          await call(`/v1/sandbox/payments/${encodeURIComponent(payment.payment_id)}/settle`, {
            method: "POST",
            token,
            signal,
            body: { status, error_message: status === "failed" ? "Declined in the sandbox." : undefined },
          });
        } catch {
          // Left pending: the poll below times out, as a real unanswered prompt would.
        }
      }

      const deadline = Date.now() + POLL_FOR_MS;
      let announcedPaid = false;
      while (Date.now() < deadline) {
        await wait(POLL_EVERY_MS, signal);
        let latest: PaymentOut;
        try {
          latest = await call<PaymentOut>(`/v1/payments/${encodeURIComponent(payment.payment_id)}`, { token, signal });
        } catch (error) {
          if (signal.aborted) throw error;
          continue; // one failed poll is not a failed payment
        }
        if (latest.message) onMessage?.(latest.message);
        if (latest.status === "successful") {
          if (!announcedPaid) onStatus("successful");
          await wait(800, signal);
          onStatus("fulfilled");
          void refreshAccount();
          return "fulfilled";
        }
        if (latest.status === "failed" || latest.status === "reversed") return "failed";
        if (latest.status === "expired") return "expired";
        // pending: the money may be in and the plan on its way
        if (!announcedPaid && /activat/i.test(latest.message ?? "")) {
          announcedPaid = true;
          onStatus("successful");
        }
      }
      return "expired";
    },
  };
}

/**
 * 8.1: the records the visitor saved, to their Farm Records with the
 * organisation. The answer says how many went; the list and totals follow.
 */
export async function saveRecords(current: Session, records: FarmRecord[]): Promise<number> {
  let saved = 0;
  for (const record of records) {
    try {
      await call("/v1/records", {
        method: "POST",
        token: current.accessToken,
        body: {
          record_type: record.type,
          amount_ugx: record.type === "activity" && !record.amount ? null : record.amount,
          description: record.description,
          category: record.category || null,
          record_date: /^\d{4}-\d{2}-\d{2}$/.test(record.date) ? record.date : null,
        },
      });
      saved += 1;
    } catch {
      // The caller says so.
    }
  }
  if (saved) void refreshRecords();
  return saved;
}
