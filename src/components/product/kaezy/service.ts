import type { Network } from "./format";

// What the "Ask Ka-Ezy, then hire it" section needs from a backend.
//
// The farmer app's own Ka-Ezy, subscription and payment APIs are built for
// the signed-in app and are not safe to call from a public web page
// (README, "Ka-Ezy on the website"). So:
// - Chat: liveChatService talks to a guest demo endpoint (README, "Ka-Ezy on
//   the website") that sends no farmer identity; without it, demoService
//   answers from the sample answers.
// - Payment: demoService simulates it until a secure payment API exists.

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

export interface KaEzyChatService {
  /** Ka-Ezy's answer to a question, as Markdown (rendered by MiniMarkdown). */
  ask(question: string, signal: AbortSignal): Promise<string>;
}

/** Why a live question failed, so the chat can say something useful. */
export class KaEzyAskError extends Error {
  constructor(readonly reason: "offline" | "busy" | "limit") {
    super(reason);
  }
}

export interface KaEzyService extends KaEzyChatService {
  pay(
    request: PaymentRequest,
    options: { onStatus: (status: PayStatus) => void; signal: AbortSignal; demoOutcome?: DemoOutcome },
  ): Promise<PayResult>;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
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
      return answer;
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
 * sends only the question, a conversation id and the mode (no phone number,
 * name or location: the server uses a demo identity, limits how much each
 * visitor can ask, and only accepts this site). Same request fields as the
 * app's POST /ai-query; same response shape ({response, thread_id}).
 */
export function liveChatService({ endpoint }: { endpoint: string }): KaEzyChatService {
  let threadId = newThreadId();
  return {
    async ask(question, signal) {
      const body = new FormData();
      body.set("question", question);
      body.set("thread_id", threadId);
      body.set("agent_mode", "chat");
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
      const record = (data ?? {}) as { response?: unknown; thread_id?: unknown };
      if (typeof record.thread_id === "string" && record.thread_id) threadId = record.thread_id;
      const answer =
        typeof record.response === "string"
          ? record.response
          : typeof (record.response as { response?: unknown } | undefined)?.response === "string"
            ? (record.response as { response: string }).response
            : "";
      if (!answer.trim()) throw new KaEzyAskError("busy");
      return answer;
    },
  };
}

/** A conversation id like the app's (UUID v4), with a fallback for older phones. */
function newThreadId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
