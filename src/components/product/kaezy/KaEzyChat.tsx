"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { ArrowDown, ArrowRight, SendHorizontal } from "lucide-react";
import type { Product } from "@/lib/content";
import { MiniMarkdown } from "./MiniMarkdown";
import { KaEzyAskError, demoService, liveChatService, normalise } from "./service";

type Chat = NonNullable<Product["tryIt"]>["chat"];

/** "nudge" and "limit" end with a link to the plans; "error" is a failed question. */
type Message = { id: number; from: "you" | "kaezy" | "nudge" | "limit" | "error"; text: string };

// The app's typing indicator cycles these while Ka-Ezy works.
const THINKING = ["Thinking", "Processing", "Analyzing", "Almost there"];

/** After this many answers, Ka-Ezy suggests hiring it. */
const NUDGE_AFTER = 2;

/**
 * The Ka-Ezy chat, redrawn from the app (greeting, "Try asking" tiles,
 * thinking indicator, answers, composer) in the website's theme. With
 * `endpoint` (the guest demo endpoint) Ka-Ezy answers live; without it, from
 * the sample answers in content/products/ka-ezy.yaml (see service.ts).
 */
export function KaEzyChat({
  chat,
  tagline,
  avatar,
  hireHref,
  endpoint,
}: {
  chat: Chat;
  tagline: string;
  avatar: string;
  hireHref: string;
  /** The guest demo endpoint for live answers; empty for the sample answers. */
  endpoint: string;
}) {
  const service = useMemo(
    () =>
      endpoint
        ? liveChatService({ endpoint })
        : demoService({ answers: chat.prompts, otherQuestion: chat.ownQuestionReply }),
    [chat, endpoint],
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [asked, setAsked] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(0);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Scroll inside the chat only, never the page. While Ka-Ezy thinks, show
  // the bottom; when an answer lands, put the question above it at the top,
  // so a long answer is read from its start.
  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    const questions = thread.querySelectorAll<HTMLElement>("[data-from='you']");
    const last = questions[questions.length - 1];
    if (!last) return; // Start screen: keep the greeting in view.
    thread.scrollTop = thinking ? thread.scrollHeight : last.offsetTop - 12;
  }, [messages, thinking]);

  useEffect(() => {
    if (!thinking) return;
    const timer = window.setInterval(
      () => setThinkingStep((step) => Math.min(step + 1, THINKING.length - 1)),
      900,
    );
    return () => window.clearInterval(timer);
  }, [thinking]);

  const add = (from: Message["from"], text: string) =>
    setMessages((list) => [...list, { id: nextId.current++, from, text }]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || thinking) return;
    add("you", text);
    setAsked((list) => [...list, text]);
    setThinkingStep(0);
    setThinking(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const answer = await service.ask(text, controller.signal);
      add("kaezy", answer);
      if (asked.length + 1 === NUDGE_AFTER) add("nudge", chat.nudge);
    } catch (error) {
      // Anything else is an abort (the visitor left the page): nothing to show.
      if (error instanceof KaEzyAskError) {
        add(error.reason === "limit" ? "limit" : "error", chat.errors[error.reason]);
      }
    } finally {
      setThinking(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (thinking || !draft.trim()) return;
    const question = draft;
    setDraft("");
    void ask(question);
  }

  /**
   * Asking from a tile or chip removes that button, so move focus: to the
   * composer for keyboard users, to the conversation for taps (focusing the
   * composer on a phone would open the keyboard over the answer).
   */
  function askFromButton(event: MouseEvent, question: string) {
    void ask(question);
    const target = event.detail === 0 ? inputRef.current : threadRef.current;
    target?.focus({ preventScroll: true });
  }

  // A typed question that matches a sample question counts as asked.
  const askedKeys = asked.map(normalise);
  const remaining = chat.prompts.filter((p) => !askedKeys.includes(normalise(p.q)));
  const started = messages.length > 0;

  return (
    <div className="flex h-[38rem] flex-col overflow-hidden rounded-card border border-line bg-card shadow-raised">
      {/* Header, as in the app: avatar, name, what it does. */}
      <div className="flex items-center gap-3 bg-brand px-4 py-3 text-on-brand">
        <span className="flex size-12 shrink-0 items-end justify-center overflow-hidden rounded-full bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
          <img src={avatar} alt="" width={200} height={178} className="w-11" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-heading">Ka-Ezy</span>
          <span className="block text-sm leading-snug text-on-brand/85">{tagline}</span>
        </span>
        <span className="shrink-0 rounded-pill border border-on-brand/40 px-2.5 py-0.5 text-xs font-label">
          {endpoint ? "Live demo" : "Sample answers"}
        </span>
      </div>

      <div
        ref={threadRef}
        role="log"
        aria-label="Conversation with Ka-Ezy"
        // Focusable so it can be scrolled from the keyboard (Safari does not
        // make scroll areas focusable on its own).
        tabIndex={0}
        className="relative flex-1 space-y-4 overflow-y-auto px-4 py-5 focus-visible:-outline-offset-2"
      >
        {started ? null : (
          <div className="flex min-h-full flex-col justify-center text-center">
            <p className="text-2xl font-heading tracking-heading text-heading">{chat.greeting}</p>
            <p className="mx-auto mt-1 max-w-xs text-base text-pretty text-muted">{chat.subtitle}</p>
            <p className="mt-6 text-sm text-label-style text-label">{chat.tryAsking}</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-left">
              {chat.prompts.map((prompt, i) => (
                <li key={prompt.q}>
                  <button
                    type="button"
                    onClick={(event) => askFromButton(event, prompt.q)}
                    data-track="kaezy_try_prompt"
                    data-track-prompt={String(i + 1)}
                    className="flex h-full min-h-16 w-full cursor-pointer items-center rounded-control border border-line bg-card p-3 text-sm font-label text-title transition-colors hover:border-secondary hover:bg-brand-soft"
                  >
                    {prompt.q}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted">
              <ArrowDown aria-hidden="true" className="size-4" />
              or type your own question below
            </p>
          </div>
        )}

        {messages.map((message) =>
          message.from === "you" ? (
            <div key={message.id} data-from="you" className="flex justify-end">
              <p className="max-w-[85%] rounded-card rounded-br-none bg-brand-soft px-4 py-2.5 text-base wrap-anywhere text-title">
                <span className="sr-only">You: </span>
                {message.text}
              </p>
            </div>
          ) : (
            <div key={message.id} className="flex items-start gap-2.5">
              <KaEzyAvatar src={avatar} />
              <div className="max-w-[88%] rounded-card rounded-tl-none border border-line bg-subtle px-4 py-3 text-base text-body">
                <span className="sr-only">Ka-Ezy: </span>
                {message.from === "nudge" || message.from === "limit" ? (
                  <>
                    <p>{message.text}</p>
                    <a
                      href={hireHref}
                      data-track="kaezy_try_nudge"
                      className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-control font-heading text-link hover:underline"
                    >
                      See Ka-Ezy plans
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </a>
                  </>
                ) : (
                  <MiniMarkdown text={message.text} />
                )}
              </div>
            </div>
          ),
        )}

        {thinking ? (
          <div className="flex items-start gap-2.5">
            <KaEzyAvatar src={avatar} />
            <p className="inline-flex items-center gap-2 rounded-card rounded-tl-none border border-line bg-subtle px-4 py-3 text-sm font-label text-muted">
              <span className="sr-only">Ka-Ezy is answering</span>
              <span aria-hidden="true">{THINKING[thinkingStep]}</span>
              <span aria-hidden="true" className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    style={{ animationDelay: `${delay}ms` }}
                    className="size-1.5 rounded-full bg-muted motion-safe:animate-bounce"
                  />
                ))}
              </span>
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line bg-card p-3">
        {started && remaining.length > 0 ? (
          // One swipeable row on phones, so the chips don't squeeze the answer;
          // py-1 keeps the focus ring from being clipped.
          <ul
            aria-label="More questions to try"
            className="mb-2 flex gap-2 overflow-x-auto py-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
          >
            {remaining.map((prompt) => (
              <li key={prompt.q} className="shrink-0">
                <button
                  type="button"
                  disabled={thinking}
                  onClick={(event) => askFromButton(event, prompt.q)}
                  data-track="kaezy_try_prompt"
                  data-track-prompt={String(chat.prompts.indexOf(prompt) + 1)}
                  className="min-h-11 cursor-pointer rounded-pill border border-line bg-card px-3 py-1.5 text-left text-sm font-label whitespace-nowrap text-title transition-colors hover:border-secondary hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt.q}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {/* method="dialog": before the scripts load, Enter does nothing
            instead of reloading the page. */}
        <form method="dialog" onSubmit={onSubmit} className="flex items-center gap-2">
          <label htmlFor="kaezy-question" className="sr-only">
            Your question for Ka-Ezy
          </label>
          <input
            ref={inputRef}
            id="kaezy-question"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={chat.placeholder}
            maxLength={300}
            autoComplete="off"
            className="min-h-12 min-w-0 flex-1 rounded-pill border border-line bg-canvas px-4 text-base text-title placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={thinking || !draft.trim()}
            aria-label="Send"
            data-track="kaezy_try_ask"
            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendHorizontal aria-hidden="true" className="size-5" />
          </button>
        </form>
        <p className="mt-2 px-1 text-xs text-muted">{chat.disclaimer}</p>
      </div>
    </div>
  );
}

function KaEzyAvatar({ src }: { src: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-end justify-center overflow-hidden rounded-full border border-line bg-card"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
      <img src={src} alt="" width={200} height={178} className="w-7" />
    </span>
  );
}
