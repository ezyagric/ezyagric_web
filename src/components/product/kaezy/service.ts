import type { Network } from "./format";
import { acresOf, formatAcres, type Profile } from "./personalise";
import { newThreadId, type FarmRecord, type KaEzyVideo } from "./store";

// What the "Ask Ka-Ezy, then hire it" section needs from a backend
// (tickets in docs/backend-tickets.md: BT-01 live answers, BT-03 sign-in,
// BT-04 plans, BT-05 payment).
//
// The farmer app's own Ka-Ezy, subscription and payment APIs are built for
// the signed-in app and are not safe to call from a public web page
// (README, "Ka-Ezy on the website"). So:
// - Chat: liveChatService talks to a guest demo endpoint (README, "Ka-Ezy on
//   the website") that sends no farmer identity; without it, demoService
//   answers from the sample answers.
// - Payment: demoService simulates it; signed in through the Partner API,
//   partner.ts's partnerPayService sells the plan for real (step 12 of the
//   Partner API guide), with the prompt on the signed-in phone.

/** Payment progress, named as in the app's payment intents. */
export type PayStatus =
  | "sending"
  | "instructions_sent"
  | "successful"
  | "fulfilled"
  | "failed"
  | "expired";

export type PayResult = "fulfilled" | "failed" | "expired";

/** Preview builds only: lets reviewers see every ending of the demo. */
export type DemoOutcome = "approved" | "declined" | "timed_out";

export type PaymentRequest = {
  planName: string;
  months: number;
  amountUgx: number;
  network: Network;
  /** 9 national digits. */
  payingNumber: string;
  /** The EzyAgric App account the plan is added to (9 national digits). */
  accountNumber: string;
};

/** Ka-Ezy's answer: Markdown (rendered by MiniMarkdown), plus any records it proposes to save. */
export type KaEzyReply = {
  text: string;
  records?: FarmRecord[];
  /** The thread the server answered on (live answers only). */
  threadId?: string;
  /** A curated advisory video that goes with the answer (Partner API). */
  video?: KaEzyVideo;
};

export type AskOptions = {
  /**
   * The app's agent modes; "farm_plan" takes the plan form as a JSON
   * question, "diagnosis" a photo check ({type, symptoms, notes} as JSON).
   */
  mode?: "chat" | "farm_plan" | "diagnosis";
  /** "Your farm", so Ka-Ezy can tailor its answer. */
  profile?: Profile;
  /** The conversation's Ka-Ezy thread, so each conversation keeps its own context. */
  threadId?: string;
  /** Photos for a photo check, as JPEG (see photo.ts). */
  photos?: Blob[];
};

export interface KaEzyChatService {
  ask(question: string, signal: AbortSignal, options?: AskOptions): Promise<KaEzyReply>;
}

/** Why a live question failed, so the chat can say something useful. */
export class KaEzyAskError extends Error {
  constructor(readonly reason: AskFailure) {
    super(reason);
  }
}

/**
 * Why a question failed, each with its own line in tryIt.chat.errors. The
 * last three come only from the Partner API (partner.ts): the sign-in died,
 * the organisation has not turned the feature on, or Ka-Ezy does not have
 * the value chain a plan was asked for.
 */
export type AskFailure =
  | "offline"
  | "busy"
  | "limit"
  | "signedOut"
  | "notEnabled"
  | "unknownValueChain";

export interface KaEzyService extends KaEzyChatService {
  pay(
    request: PaymentRequest,
    options: {
      onStatus: (status: PayStatus) => void;
      signal: AbortSignal;
      demoOutcome?: DemoOutcome;
      /** What the payment system said, in words to show (a failure's reason). */
      onMessage?: (text: string) => void;
    },
  ): Promise<PayResult>;
}

/** Waits `ms`, like an answer on its way; rejects if the visitor leaves (`signal`). */
export function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/** "What should I plant this season?" and "what should i plant this season" match. */
export function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Sample answers for the starter questions, a fixed reply for anything
 * else, and a simulated Mobile Money payment. Nothing leaves the browser.
 */
export function demoService({
  answers,
  otherQuestion,
}: {
  answers: { q: string; a: string }[];
  otherQuestion: string;
}): KaEzyService {
  return {
    async ask(question, signal) {
      const match = answers.find((item) => normalise(item.q) === normalise(question));
      const answer = match?.a ?? otherQuestion;
      // About as long as a short real answer takes to arrive.
      await wait(1400 + Math.min(1600, answer.length * 2), signal);
      return { text: answer };
    },

    async pay(_request, { onStatus, signal, demoOutcome = "approved" }) {
      onStatus("sending");
      await wait(1500, signal);
      onStatus("instructions_sent");
      await wait(3500, signal);
      if (demoOutcome === "declined") return "failed";
      if (demoOutcome === "timed_out") return "expired";
      onStatus("successful");
      await wait(1800, signal);
      onStatus("fulfilled");
      return "fulfilled";
    },
  };
}

/**
 * Ka-Ezy's real answers through the website's guest demo endpoint. The page
 * sends the question, a conversation id, the mode, whatever the visitor gave
 * in "Your farm" (first name, location, value chain, acres) and, for a photo
 * check, the photo (as the app does: JPEG files named `images`). Never a
 * phone number or account: the server answers as a demo identity, limits how
 * much each visitor can ask, and only accepts this site. Same request fields
 * as the app's POST /ai-query; same response shape ({response, thread_id,
 * ui_attachments}).
 */
export function liveChatService({ endpoint }: { endpoint: string }): KaEzyChatService {
  return {
    async ask(question, signal, { mode = "chat", profile, threadId = newThreadId(), photos = [] } = {}) {
      const body = new FormData();
      body.set("question", question);
      body.set("thread_id", threadId);
      body.set("agent_mode", mode);
      // The visitor's farm details (all optional; never a phone number).
      const acres = profile ? acresOf(profile) : null;
      if (profile?.name.trim()) body.set("farmer_name", profile.name.trim());
      if (profile?.location.trim()) body.set("farmer_location", profile.location.trim());
      if (profile?.valueChain) body.set("value_chains", JSON.stringify([profile.valueChain]));
      if (acres) body.set("land_size_acres", formatAcres(acres));
      for (const photo of photos) body.append("images", photo, "photo.jpg");
      // Ka-Ezy turns can take over a minute (the app allows 180 s).
      const timed = withTimeout(signal, 120_000);
      let response: Response;
      try {
        response = await fetch(endpoint, { method: "POST", body, credentials: "omit", signal: timed.signal });
      } catch (error) {
        if (signal.aborted) throw error;
        throw new KaEzyAskError(timed.timedOut() ? "busy" : "offline");
      } finally {
        timed.done();
      }
      // 402 is the app's "subscription usage limit"; 429 is the demo's rate limit.
      if (response.status === 402 || response.status === 429) throw new KaEzyAskError("limit");
      if (!response.ok) throw new KaEzyAskError("busy");
      const data: unknown = await response.json().catch(() => null);
      const record = (data ?? {}) as { response?: unknown; thread_id?: unknown; ui_attachments?: unknown };
      const answer =
        typeof record.response === "string"
          ? record.response
          : typeof (record.response as { response?: unknown } | undefined)?.response === "string"
            ? (record.response as { response: string }).response
            : "";
      if (!answer.trim()) throw new KaEzyAskError("busy");
      return {
        text: answer,
        records: proposedRecords(record.ui_attachments),
        threadId: typeof record.thread_id === "string" && record.thread_id ? record.thread_id : threadId,
      };
    },
  };
}

/**
 * `signal` plus a time limit. (AbortSignal.any and AbortSignal.timeout are
 * missing on the older Android phones many farmers use.)
 */
function withTimeout(signal: AbortSignal, ms: number) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  const onAbort = () => controller.abort(signal.reason);
  if (signal.aborted) onAbort();
  else signal.addEventListener("abort", onAbort, { once: true });
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    done: () => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
    },
  };
}

/**
 * The records Ka-Ezy proposes to save (the app's `ui_attachments` of type
 * "record_proposal"). On the website they are shown and saved on the device
 * only, never to a real account.
 */
function proposedRecords(attachments: unknown): FarmRecord[] | undefined {
  const a = attachments as { type?: unknown; records?: unknown } | null | undefined;
  if (!a || a.type !== "record_proposal" || !Array.isArray(a.records)) return undefined;
  const records = a.records.flatMap((raw: Record<string, unknown>): FarmRecord[] => {
    const type = String(raw?.record_type ?? "expense").toLowerCase();
    const amount = Number(raw?.amount ?? 0);
    if (!["income", "expense", "activity"].includes(type) || !Number.isFinite(amount)) return [];
    return [
      {
        type: type as FarmRecord["type"],
        category: String(raw?.category ?? "").slice(0, 60),
        description: String(raw?.description ?? "Farm record").slice(0, 200),
        amount: Math.max(0, Math.round(amount)),
        date: String(raw?.date ?? "").slice(0, 10),
      },
    ];
  });
  return records.length > 0 ? records : undefined;
}
