"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowDown } from "lucide-react";
import { Chips, Composer } from "./Composer";
import { fill, promptsFor, type Profile, type TryIt } from "./personalise";
import { KaEzyAskError, demoService, normalise, type KaEzyChatService } from "./service";
import { demo, newId, type Conversation, type Message } from "./store";
import { Thread, type ThreadLabels } from "./Thread";

/** After this many answers, Ka-Ezy suggests hiring it. */
const NUDGE_AFTER = 2;

/**
 * Farm Expert: the app's chat (greeting, "Try asking" tiles, answers,
 * composer), personalised from "Your farm": the starter questions follow
 * the chosen crop or animal, and answers use the farmer's name, location
 * and land size. `live` answers through the guest demo endpoint; without
 * it, from the sample answers.
 */
export function ExpertPanel({
  copy,
  profile,
  conversation,
  avatar,
  hireHref,
  live,
  labels,
  onChooseValueChain,
}: {
  copy: TryIt;
  profile: Profile;
  conversation: Conversation | undefined;
  avatar: string;
  hireHref: string;
  live: KaEzyChatService | null;
  labels: ThreadLabels;
  onChooseValueChain: () => void;
}) {
  const chat = copy.chat;
  const prompts = promptsFor(chat, copy.valueChains, profile);
  // The conversation waiting for Ka-Ezy, if any (the "thinking" bubble shows only there).
  const [pendingId, setPendingId] = useState<string | null>(null);
  const thinking = pendingId !== null;
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messages = conversation?.messages ?? [];

  useEffect(() => () => abortRef.current?.abort(), []);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || thinking) return;
    const conversationId = demo.append("expert", [{ id: newId(), from: "you", text }], text);
    setPendingId(conversationId);
    const controller = new AbortController();
    abortRef.current = controller;
    const service =
      live ?? demoService({ answers: prompts, otherQuestion: fill(chat.ownQuestionReply, profile) });
    try {
      const reply = await service.ask(text, controller.signal, {
        mode: "chat",
        profile,
        threadId: demo.threadOf(conversationId),
      });
      if (reply.threadId) demo.setThread(conversationId, reply.threadId);
      const out: Message[] = [{ id: newId(), from: "kaezy", text: reply.text }];
      if (reply.records) {
        out.push({ id: newId(), from: "record", text: copy.records.prompt, records: reply.records, status: "pending" });
      }
      const answered =
        (demo.conversation(conversationId)?.messages ?? []).filter((m) => m.from === "kaezy").length + 1;
      if (answered === NUDGE_AFTER) out.push({ id: newId(), from: "nudge", text: chat.nudge });
      demo.appendTo(conversationId, out);
    } catch (error) {
      // Anything else is an abort (the visitor left the page): nothing to show.
      if (error instanceof KaEzyAskError) {
        demo.appendTo(conversationId, [
          { id: newId(), from: error.reason === "limit" ? "limit" : "error", text: chat.errors[error.reason] },
        ]);
      }
    } finally {
      setPendingId(null);
    }
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

  const askedKeys = messages.filter((m) => m.from === "you").map((m) => normalise("text" in m ? m.text : ""));
  const remaining = prompts.filter((p) => !askedKeys.includes(normalise(p.q))).map((p) => p.q);
  const greeting = profile.name.trim() ? fill(chat.greetingNamed, profile) : chat.greeting;

  return (
    <>
      <Thread
        threadRef={threadRef}
        messages={messages}
        thinking={thinking && pendingId === conversation?.id}
        avatar={avatar}
        hireHref={hireHref}
        label="Conversation with Ka-Ezy"
        labels={labels}
        onRecord={recordDecision}
        empty={
          <div className="flex min-h-full flex-col justify-center text-center">
            <p className="text-2xl font-heading tracking-heading text-heading">{greeting}</p>
            <p className="mx-auto mt-1 max-w-xs text-base text-pretty text-muted">{chat.subtitle}</p>
            {profile.valueChain ? (
              <p className="mx-auto mt-3 inline-flex rounded-pill bg-brand-soft px-3 py-1 text-sm font-label text-title">
                {fill(chat.personalised, profile)}
              </p>
            ) : (
              <button
                type="button"
                onClick={onChooseValueChain}
                className="mx-auto mt-3 min-h-11 cursor-pointer rounded-control px-2 text-sm font-label text-link underline"
              >
                {chat.choosePrompt}
              </button>
            )}
            <p className="mt-5 text-sm text-label-style text-label">{chat.tryAsking}</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-left">
              {prompts.map((prompt, i) => (
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
        }
      />
      <div className="border-t border-line bg-card p-3">
        {messages.length > 0 ? (
          <Chips
            label="More questions to try"
            items={remaining}
            disabled={thinking}
            onPick={askFromButton}
            track="kaezy_try_prompt"
          />
        ) : null}
        <Composer
          id="kaezy-question"
          label="Your question for Ka-Ezy"
          placeholder={chat.placeholder}
          disabled={thinking}
          onSend={(text) => void ask(text)}
          inputRef={inputRef}
          track="kaezy_try_ask"
        />
        <p className="mt-2 px-1 text-xs text-muted">{chat.disclaimer}</p>
      </div>
    </>
  );

  function recordDecision(message: Message, save: boolean) {
    if (!conversation || message.from !== "record") return;
    demo.updateMessage(conversation.id, message.id, (m) =>
      m.from === "record" ? { ...m, status: save ? "saved" : "dismissed" } : m,
    );
    if (save) demo.saveRecords(message.records);
  }
}
