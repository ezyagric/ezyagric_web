"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ChevronDown } from "lucide-react";
import { formatUgx } from "./format";
import { Chips, Composer } from "./Composer";
import type { Profile, TryIt } from "./personalise";
import { parseRecord, totals } from "./records";
import { KaEzyAskError, type KaEzyChatService } from "./service";
import type { AccountRecords } from "./partner";
import { demo, newId, type Conversation, type FarmRecord, type Message } from "./store";
import { Thread, type ThreadLabels } from "./Thread";

/** After this many saved records, Ka-Ezy points to the app. */
const NUDGE_AFTER = 3;

/**
 * Farm Records: the visitor says what happened ("Sold 5 bags of maize for
 * 600,000"), Ka-Ezy turns it into a record card to save (the app's record
 * proposal), and the season's income, expenses and profit add up above.
 * Signed in, the totals and the list above the conversation are the account's
 * (`account`), and a saved record goes there too (`remote`).
 */
export function RecordsPanel({
  copy,
  profile,
  conversation,
  records,
  avatar,
  hireHref,
  live,
  labels,
  remote = null,
  account = null,
}: {
  copy: TryIt;
  profile: Profile;
  conversation: Conversation | undefined;
  records: FarmRecord[];
  avatar: string;
  hireHref: string;
  live: KaEzyChatService | null;
  labels: ThreadLabels;
  /** Signed in: also saves the records to the visitor's account (best effort). */
  remote?: ((records: FarmRecord[]) => void) | null;
  /** Signed in: the records and totals on their account, once loaded. */
  account?: AccountRecords | null;
}) {
  const r = copy.records;
  // The conversation waiting for Ka-Ezy, if any (the "thinking" bubble shows only there).
  const [pendingId, setPendingId] = useState<string | null>(null);
  const thinking = pendingId !== null;
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sum = account?.totals ?? totals(records);
  // The list is out of the way once the visitor gets to work on a new record.
  const [listOpen, setListOpen] = useState(true);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(input: string) {
    const text = input.trim();
    if (!text || thinking) return;
    setListOpen(false);
    const conversationId = demo.append("records", [{ id: newId(), from: "you", text }], text);
    setPendingId(conversationId);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (live) {
        const reply = await live.ask(text, controller.signal, {
          mode: "chat",
          profile,
          threadId: demo.threadOf(conversationId),
        });
        if (reply.threadId) demo.setThread(conversationId, reply.threadId);
        const out: Message[] = [{ id: newId(), from: "kaezy", text: reply.text }];
        if (reply.records) {
          out.push({ id: newId(), from: "record", text: r.prompt, records: reply.records, status: "pending" });
        }
        demo.appendTo(conversationId, out);
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 1100));
        if (controller.signal.aborted) return;
        const record = parseRecord(text);
        demo.appendTo(conversationId, [
          record
            ? { id: newId(), from: "record", text: r.prompt, records: [record], status: "pending" }
            : { id: newId(), from: "kaezy", text: r.notUnderstood },
        ]);
      }
    } catch (error) {
      if (error instanceof KaEzyAskError) {
        demo.appendTo(conversationId, [
          {
            id: newId(),
            from: error.reason === "limit" ? "limit" : "error",
            text: copy.chat.errors[error.reason],
          },
        ]);
      }
    } finally {
      setPendingId(null);
    }
  }

  function decide(message: Message, save: boolean) {
    if (!conversation || message.from !== "record") return;
    demo.updateMessage(conversation.id, message.id, (m) =>
      m.from === "record" ? { ...m, status: save ? "saved" : "dismissed" } : m,
    );
    if (!save) return;
    demo.saveRecords(message.records);
    remote?.(message.records);
    // Signed in, they have an account already; a guest is pointed to the app.
    if (!remote && records.length < NUDGE_AFTER && records.length + message.records.length >= NUDGE_AFTER) {
      demo.appendTo(conversation.id, [{ id: newId(), from: "nudge", text: r.nudge }]);
    }
  }

  function pick(event: MouseEvent, text: string) {
    void send(text);
    (event.detail === 0 ? inputRef.current : threadRef.current)?.focus({ preventScroll: true });
  }

  return (
    <>
      {/* The season's totals, from the saved records. */}
      <dl
        className="grid grid-cols-3 gap-2 border-b border-line bg-card px-4 py-3 text-center"
        aria-live="polite"
        aria-atomic="true"
      >
        <Total label={r.totals.income} value={sum.income} />
        <Total label={r.totals.expenses} value={sum.expenses} />
        <Total label={r.totals.profit} value={sum.profit} strong />
      </dl>
      {account && account.records.length > 0 ? (
        <details
          open={listOpen}
          onToggle={(event) => setListOpen(event.currentTarget.open)}
          className="group border-b border-line bg-card"
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-label text-title [&::-webkit-details-marker]:hidden">
            {r.listTitle} ({account.count})
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <ul className="max-h-52 divide-y divide-line overflow-y-auto border-t border-line px-4">
            {account.records.map((record) => (
              <li key={record.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block text-title">{record.description}</span>
                  <span className="block text-xs text-muted">
                    {[recordDay(record.date), record.category].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {record.type === "activity" ? null : (
                  <span className={`shrink-0 font-label tabular-nums ${record.type === "income" ? "text-accent" : "text-title"}`}>
                    {record.type === "income" ? "+" : "−"}
                    {formatUgx(record.amount)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <Thread
        threadRef={threadRef}
        messages={conversation?.messages ?? []}
        thinking={thinking && pendingId === conversation?.id}
        avatar={avatar}
        hireHref={hireHref}
        label="Farm records with Ka-Ezy"
        labels={labels}
        onRecord={decide}
        empty={<p className="mx-auto max-w-sm text-center text-base text-pretty text-muted">{r.intro}</p>}
      />
      <div className="border-t border-line bg-card p-3">
        <Chips label="Examples to try" items={r.examples} disabled={thinking} onPick={pick} track="kaezy_try_record_example" />
        <Composer
          id="kaezy-record"
          label="What happened on your farm?"
          placeholder={r.placeholder}
          disabled={thinking}
          onSend={(text) => void send(text)}
          inputRef={inputRef}
          track="kaezy_try_record"
        />
      </div>
    </>
  );
}

/** "2026-10-31" -> "31 Oct 2026" */
function recordDay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Total({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-label-style text-label">{label}</dt>
      <dd
        className={`text-sm font-heading wrap-anywhere sm:text-base ${
          strong ? (value >= 0 ? "text-accent" : "text-danger") : "text-title"
        }`}
      >
        {formatUgx(value)}
      </dd>
    </div>
  );
}
