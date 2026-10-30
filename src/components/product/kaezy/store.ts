import { useSyncExternalStore } from "react";
import { EMPTY_PROFILE, type Profile } from "./personalise";

// The demo's state, kept on the visitor's device only (localStorage): the
// farm details, past conversations and saved records. Every read and write
// is guarded, so a private window or blocked storage just means nothing is
// remembered. Components read it with useDemo(); the server render and the
// first client render see the empty state, then the saved one.

export type Tab = "expert" | "plan" | "records" | "mapping";
/** In the order the tabs show. */
export const TABS: Tab[] = ["expert", "mapping", "plan", "records"];

export type FarmRecord = {
  type: "income" | "expense" | "activity";
  category: string;
  description: string;
  /** UGX; 0 for an activity without a cost. */
  amount: number;
  /** YYYY-MM-DD */
  date: string;
};

export type PlanResult = {
  title: string;
  startDate: string;
  variety: string;
  rows: { date: string; label: string; cost: number }[];
  total: number;
  harvest: { amount: number; unit: string; income: number };
  profit: number;
};

export type MapResult = { acres: number; m2: number; perimeter: number };

/**
 * One of EzyAgric's curated advisory videos (reviewed YouTube videos), as
 * the Partner API attaches it to an answer. Played in place from
 * youtube-nocookie.com when tapped.
 */
export type KaEzyVideo = { title: string; url: string; youtubeId: string; source: string };

/**
 * A photo in the visitor's message: a sample photo from the site, or a small
 * JPEG copy of their own (see photo.ts), kept with the conversation. The
 * size keeps its space in the conversation while it loads.
 */
export type Photo = { src: string; alt: string; width: number; height: number };

/** Ka-Ezy's photo check of a sample photo, as the app shows it. */
export type Diagnosis = {
  kind: "pest" | "disease";
  name: string;
  crop: string;
  intro: string;
  signs: string[];
  steps: string[];
};

type Base = { id: string };
export type Message = Base &
  (
    | { from: "you"; text: string; photo?: Photo }
    | { from: "kaezy"; text: string; video?: KaEzyVideo }
    | { from: "nudge" | "limit" | "error" | "signin"; text: string }
    | { from: "diagnosis"; diagnosis: Diagnosis }
    | { from: "plan"; plan: PlanResult }
    | { from: "record"; text: string; records: FarmRecord[]; status: "pending" | "saved" | "dismissed" }
    | { from: "map"; text: string; map: MapResult }
  );

export type Conversation = {
  id: string;
  tab: Tab;
  title: string;
  at: number;
  messages: Message[];
  /** Ka-Ezy's thread for this conversation (live answers keep their context per conversation). */
  threadId: string;
};

export type DemoState = {
  profile: Profile;
  conversations: Conversation[];
  /** The open conversation of each tab (none: a fresh start). */
  current: Partial<Record<Tab, string>>;
  records: FarmRecord[];
};

const KEY = "ezyagric:kaezy-demo:v1";
const MAX_CONVERSATIONS = 15;
const EMPTY: DemoState = { profile: EMPTY_PROFILE, conversations: [], current: {}, records: [] };

let state: DemoState | null = null;
let counter = 0;
const listeners = new Set<() => void>();

export function newId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

/** A conversation id for Ka-Ezy, like the app's (UUID v4), with a fallback for older phones. */
export function newThreadId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const isString = (value: unknown): value is string => typeof value === "string";
const isRecord = (r: unknown): r is FarmRecord => {
  const v = r as FarmRecord | null;
  return (
    !!v &&
    ["income", "expense", "activity"].includes(v.type) &&
    Number.isFinite(v.amount) &&
    isString(v.category) &&
    isString(v.description) &&
    isString(v.date)
  );
};

// Only these can be shown as a photo: a JPEG data URL (the visitor's own
// photo, at most a few hundred KB) or one of the site's sample photos.
const OWN_PHOTO = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;
const SAMPLE_PHOTO = /^\/images\/diagnosis\/[a-z0-9-]+\.svg$/;
export const MAX_PHOTO_LENGTH = 400_000;

const isSize = (value: unknown) => typeof value === "number" && value >= 1 && value <= 4000;
const isPhoto = (p: unknown): p is Photo => {
  const v = p as Photo | null;
  return (
    !!v &&
    isString(v.alt) &&
    isSize(v.width) &&
    isSize(v.height) &&
    isString(v.src) &&
    v.src.length <= MAX_PHOTO_LENGTH &&
    (OWN_PHOTO.test(v.src) || SAMPLE_PHOTO.test(v.src))
  );
};

const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);

// Only a real YouTube video can be shown from a saved conversation.
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
export const isVideo = (v: unknown): v is KaEzyVideo => {
  const value = v as KaEzyVideo | null;
  return (
    !!value &&
    isString(value.title) &&
    isString(value.source) &&
    isString(value.youtubeId) &&
    YOUTUBE_ID.test(value.youtubeId) &&
    isString(value.url) &&
    /^https:\/\/(www\.)?youtube\.com\/watch\?v=/.test(value.url)
  );
};

/** A saved message that could not render (old version, edited by hand) is dropped. */
function isMessage(m: unknown): m is Message {
  const v = m as Record<string, unknown> | null;
  if (!v || !isString(v.id)) return false;
  switch (v.from) {
    case "you":
      return isString(v.text) && (v.photo === undefined || isPhoto(v.photo));
    case "kaezy":
      return isString(v.text) && (v.video === undefined || isVideo(v.video));
    case "nudge":
    case "limit":
    case "error":
    case "signin":
      return isString(v.text);
    case "diagnosis": {
      const d = v.diagnosis as Diagnosis | undefined;
      return (
        !!d &&
        (d.kind === "pest" || d.kind === "disease") &&
        isString(d.name) &&
        isString(d.crop) &&
        isString(d.intro) &&
        isStrings(d.signs) &&
        isStrings(d.steps)
      );
    }
    case "plan": {
      const plan = v.plan as PlanResult | undefined;
      return !!plan && isString(plan.title) && Array.isArray(plan.rows) && !!plan.harvest;
    }
    case "record":
      return isString(v.text) && Array.isArray(v.records) && v.records.every(isRecord);
    case "map": {
      const map = v.map as MapResult | undefined;
      return isString(v.text) && !!map && Number.isFinite(map.acres);
    }
    default:
      return false;
  }
}

/** Saved data from an older or broken version is dropped, not trusted. */
function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw) as Partial<DemoState>;
    const profile = { ...EMPTY_PROFILE };
    for (const key of Object.keys(EMPTY_PROFILE) as (keyof Profile)[]) {
      const value = saved.profile?.[key];
      if (typeof value === "string") profile[key] = value.slice(0, 100);
    }
    const conversations: Conversation[] = Array.isArray(saved.conversations)
      ? saved.conversations
          .filter((c) => !!c && isString(c.id) && TABS.includes(c.tab) && Array.isArray(c.messages))
          .map((c) => ({
            id: c.id,
            tab: c.tab,
            title: isString(c.title) ? c.title : "",
            at: Number.isFinite(c.at) ? c.at : Date.now(),
            messages: c.messages.filter(isMessage),
            threadId: isString(c.threadId) ? c.threadId : newThreadId(),
          }))
      : [];
    const current: DemoState["current"] = {};
    for (const tab of TABS) {
      const id = saved.current?.[tab];
      if (typeof id === "string" && conversations.some((c) => c.id === id)) current[tab] = id;
    }
    const records = Array.isArray(saved.records) ? saved.records.filter(isRecord) : [];
    return { profile, conversations: conversations.slice(0, MAX_CONVERSATIONS), current, records };
  } catch {
    return EMPTY;
  }
}

function save(next: DemoState): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

/** The state without the visitor's own photos (their messages keep the text). */
function withoutOwnPhotos(s: DemoState): DemoState {
  return {
    ...s,
    conversations: s.conversations.map((c) => ({
      ...c,
      messages: c.messages.map((m) => {
        if (m.from !== "you" || !m.photo || !OWN_PHOTO.test(m.photo.src)) return m;
        return { id: m.id, from: m.from, text: m.text };
      }),
    })),
  };
}

function set(next: DemoState) {
  state = next;
  // Storage full (photos are the big part): keep everything but the
  // visitor's photos, which still show until the page is left. Blocked
  // storage: the demo still works, it just won't remember.
  if (!save(next)) save(withoutOwnPhotos(next));
  for (const listener of listeners) listener();
}

function get(): DemoState {
  if (!state) state = load();
  return state;
}

/** Another browser tab saved or deleted the demo: show the same data here. */
function onStorage(event: StorageEvent) {
  if (event.key !== KEY && event.key !== null) return;
  state = load();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** True when this device holds anything from the demo (for "Delete all"). */
export function hasSavedData(s: DemoState): boolean {
  return (
    s.conversations.length > 0 ||
    s.records.length > 0 ||
    Object.values(s.profile).some((value) => value.trim() !== "")
  );
}

export function useDemo(): DemoState {
  return useSyncExternalStore(subscribe, get, () => EMPTY);
}

export const demo = {
  setProfile(patch: Partial<Profile>) {
    const s = get();
    set({ ...s, profile: { ...s.profile, ...patch } });
  },

  /** Fills in farm details the visitor has left empty (from their account); typed ones stay. */
  setProfileIfEmpty(patch: Partial<Profile>) {
    const s = get();
    const next = { ...s.profile };
    let changed = false;
    for (const [key, value] of Object.entries(patch) as [keyof Profile, string][]) {
      if (value && !next[key].trim()) {
        next[key] = value.slice(0, 100);
        changed = true;
      }
    }
    if (changed) set({ ...s, profile: next });
  },

  /** The open conversation of a tab, if any. */
  current(tab: Tab): Conversation | undefined {
    const s = get();
    return s.conversations.find((c) => c.id === s.current[tab]);
  },

  /**
   * Adds messages to the tab's open conversation, starting one (titled
   * `title`) if needed. Returns its id, so a reply that arrives later goes
   * to the same conversation even if the visitor has opened another.
   */
  append(tab: Tab, messages: Message[], title: string): string {
    const s = get();
    const open = s.conversations.find((c) => c.id === s.current[tab]);
    if (open) {
      demo.appendTo(open.id, messages);
      return open.id;
    }
    const conversation: Conversation = {
      id: newId(),
      tab,
      title: title.slice(0, 80),
      at: Date.now(),
      messages,
      threadId: newThreadId(),
    };
    set({
      ...s,
      conversations: [conversation, ...s.conversations].slice(0, MAX_CONVERSATIONS),
      current: { ...s.current, [tab]: conversation.id },
    });
    return conversation.id;
  },

  /**
   * Puts a conversation fetched from the visitor's account into the list
   * (replacing an earlier copy of it) and opens it in its tab.
   */
  importConversation(conversation: Conversation) {
    const s = get();
    set({
      ...s,
      conversations: [conversation, ...s.conversations.filter((c) => c.id !== conversation.id)].slice(0, MAX_CONVERSATIONS),
      current: { ...s.current, [conversation.tab]: conversation.id },
    });
  },

  /** Adds messages to one conversation (no-op if it was deleted meanwhile). */
  appendTo(conversationId: string, messages: Message[]) {
    const s = get();
    const target = s.conversations.find((c) => c.id === conversationId);
    if (!target) return;
    const updated = { ...target, at: Date.now(), messages: [...target.messages, ...messages] };
    set({ ...s, conversations: [updated, ...s.conversations.filter((c) => c.id !== conversationId)] });
  },

  conversation(conversationId: string): Conversation | undefined {
    return get().conversations.find((c) => c.id === conversationId);
  },

  /** The thread for a conversation's next live question. */
  threadOf(conversationId: string): string | undefined {
    return get().conversations.find((c) => c.id === conversationId)?.threadId;
  },

  /** Ka-Ezy answered on a different thread: keep using that one. */
  setThread(conversationId: string, threadId: string) {
    const s = get();
    if (!s.conversations.some((c) => c.id === conversationId && c.threadId !== threadId)) return;
    set({
      ...s,
      conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, threadId } : c)),
    });
  },

  updateMessage(conversationId: string, messageId: string, change: (message: Message) => Message) {
    const s = get();
    set({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? change(m) : m)) }
          : c,
      ),
    });
  },

  newConversation(tab: Tab) {
    const s = get();
    set({ ...s, current: { ...s.current, [tab]: undefined } });
  },

  open(conversation: Conversation) {
    const s = get();
    set({ ...s, current: { ...s.current, [conversation.tab]: conversation.id } });
  },

  saveRecords(records: FarmRecord[]) {
    const s = get();
    set({ ...s, records: [...s.records, ...records] });
  },

  /** Forget everything this device remembers: farm details, conversations and records. */
  clearAll() {
    set(EMPTY);
  },
};
