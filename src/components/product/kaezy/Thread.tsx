"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { formatUgx } from "./format";
import { acresText } from "./personalise";
import { MiniMarkdown } from "./MiniMarkdown";
import type { Diagnosis, FarmRecord, KaEzyVideo, MapResult, Message, PlanResult } from "./store";

/** Words the thread shows, from content/products/ka-ezy.yaml. */
export type ThreadLabels = {
  seePlans: string;
  planNudge: string;
  planNote: string;
  recordSaved: string;
  recordDismissed: string;
  /** "Use {mapped} acres in Your farm" */
  mapUse: string;
  mapPlan: string;
  /** The photo check's card: "Pest detected", "Disease detected", "What I see", "What to do". */
  pest: string;
  disease: string;
  signs: string;
  steps: string;
  diagnosisNote: string;
  diagnosisNudge: string;
  /** The sign-in button under a sample answer. */
  signIn: string;
};

// The app's typing indicator cycles these while Ka-Ezy works.
const THINKING = ["Thinking", "Processing", "Analyzing", "Almost there"];

export const SMALL_PRIMARY =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-button bg-primary px-4 text-sm font-label text-on-primary transition-colors hover:bg-primary-hover";
export const SMALL_SECONDARY =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-button border border-line bg-card px-4 text-sm font-label text-title transition-colors hover:border-secondary";

export function KaEzyAvatar({ src, size = "sm" }: { src: string; size?: "sm" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-end justify-center overflow-hidden rounded-full bg-card ${
        size === "lg" ? "size-12" : "size-8 border border-line"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
      <img src={src} alt="" width={200} height={178} className={size === "lg" ? "w-11" : "w-7"} />
    </span>
  );
}

/** Ka-Ezy's bubble: avatar on the left, content in a tinted card. */
export function KaEzyBubble({ avatar, children }: { avatar: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <KaEzyAvatar src={avatar} />
      <div className="max-w-[88%] min-w-0 rounded-card rounded-tl-none border border-line bg-subtle px-4 py-3 text-base text-body">
        <span className="sr-only">Ka-Ezy: </span>
        {children}
      </div>
    </div>
  );
}

export function ThinkingBubble({ avatar }: { avatar: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((s) => Math.min(s + 1, THINKING.length - 1)), 900);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="flex items-start gap-2.5">
      <KaEzyAvatar src={avatar} />
      <p className="inline-flex items-center gap-2 rounded-card rounded-tl-none border border-line bg-subtle px-4 py-3 text-sm font-label text-muted">
        <span className="sr-only">Ka-Ezy is answering</span>
        <span aria-hidden="true">{THINKING[step]}</span>
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
  );
}

/**
 * A conversation: the visitor's messages on the right, Ka-Ezy's on the left,
 * including its plan, record and map cards. The scroll area is focusable, so
 * it can be scrolled from the keyboard; inside it, only the messages are a
 * live log (the start screen above them is not announced as it changes).
 */
export function Thread({
  threadRef,
  messages,
  thinking,
  avatar,
  hireHref,
  label,
  labels,
  empty,
  onRecord,
  onMapAction,
  onSignIn,
}: {
  threadRef: RefObject<HTMLDivElement | null>;
  messages: Message[];
  thinking: boolean;
  avatar: string;
  hireHref: string;
  label: string;
  labels: ThreadLabels;
  /** Shown before the first message. */
  empty?: ReactNode;
  onRecord?: (message: Message, save: boolean) => void;
  onMapAction?: (action: "use" | "plan", map: MapResult) => void;
  /** Opens the sign-in form (the "signin" message's button); absent on builds without sign-in. */
  onSignIn?: () => void;
}) {
  // Scroll inside the thread only, never the page. While Ka-Ezy thinks, show
  // the bottom; when an answer lands, put the question above it at the top,
  // so a long answer is read from its start. A tall question (one with a
  // photo) goes up further, ending halfway down, so the answer still shows.
  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    const questions = thread.querySelectorAll<HTMLElement>("[data-from='you']");
    const last = questions[questions.length - 1];
    if (!last) return;
    thread.scrollTop = thinking
      ? thread.scrollHeight
      : Math.max(last.offsetTop - 12, last.offsetTop + last.offsetHeight - thread.clientHeight / 2);
  }, [messages, thinking, threadRef]);

  return (
    <div
      ref={threadRef}
      role="region"
      aria-label={label}
      tabIndex={0}
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 focus-visible:-outline-offset-2"
    >
      {messages.length === 0 ? empty : null}
      <div role="log" aria-label={label} className="space-y-4">
        {messages.map((message) => {
          switch (message.from) {
            case "you":
              return (
                <div key={message.id} data-from="you" className="flex justify-end">
                  {message.photo ? (
                    // The photo on top, the question under it, in one bubble.
                    <div className="max-w-[85%] overflow-hidden rounded-card rounded-br-none bg-brand-soft">
                      <span className="sr-only">You: </span>
                      {/* eslint-disable-next-line @next/next/no-img-element -- a sample photo, or the visitor's own as a data URL */}
                      <img
                        src={message.photo.src}
                        alt={message.photo.alt}
                        width={message.photo.width}
                        height={message.photo.height}
                        className="block h-auto max-h-64 w-52 max-w-full object-cover"
                      />
                      <p className="w-52 max-w-full px-4 py-2.5 text-base wrap-anywhere text-title">{message.text}</p>
                    </div>
                  ) : (
                    <p className="max-w-[85%] rounded-card rounded-br-none bg-brand-soft px-4 py-2.5 text-base wrap-anywhere text-title">
                      <span className="sr-only">You: </span>
                      {message.text}
                    </p>
                  )}
                </div>
              );
            case "kaezy":
              return (
                <KaEzyBubble key={message.id} avatar={avatar}>
                  <MiniMarkdown text={message.text} />
                  {message.video ? <AdviceVideo video={message.video} className="mt-3" /> : null}
                </KaEzyBubble>
              );
            case "error":
              return (
                <KaEzyBubble key={message.id} avatar={avatar}>
                  <MiniMarkdown text={message.text} />
                </KaEzyBubble>
              );
            case "signin":
              return (
                <KaEzyBubble key={message.id} avatar={avatar}>
                  <p>{message.text}</p>
                  {onSignIn ? (
                    <button type="button" onClick={onSignIn} data-track="kaezy_sign_in_open_reply" className={`${SMALL_PRIMARY} mt-3`}>
                      {labels.signIn}
                    </button>
                  ) : null}
                </KaEzyBubble>
              );
            case "nudge":
            case "limit":
              return (
                <KaEzyBubble key={message.id} avatar={avatar}>
                  <p>{message.text}</p>
                  <HireLink href={hireHref}>{labels.seePlans}</HireLink>
                </KaEzyBubble>
              );
            case "diagnosis":
              return (
                <KaEzyBubble key={message.id} avatar={avatar}>
                  <DiagnosisCard diagnosis={message.diagnosis} hireHref={hireHref} labels={labels} />
                </KaEzyBubble>
              );
            case "plan":
              return (
                <KaEzyBubble key={message.id} avatar={avatar}>
                  <PlanCard plan={message.plan} hireHref={hireHref} labels={labels} />
                </KaEzyBubble>
              );
            case "record":
              return (
                <KaEzyBubble key={message.id} avatar={avatar}>
                  <RecordCard
                    message={message}
                    labels={labels}
                    // The buttons go away once used: keep focus in the conversation.
                    onRecord={
                      onRecord &&
                      ((m, save) => {
                        onRecord(m, save);
                        threadRef.current?.focus({ preventScroll: true });
                      })
                    }
                  />
                </KaEzyBubble>
              );
            case "map":
              return (
                <KaEzyBubble key={message.id} avatar={avatar}>
                  <MiniMarkdown text={message.text} />
                  {onMapAction && Math.round(message.map.acres * 100) > 0 ? (
                    <span className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => onMapAction("use", message.map)} className={SMALL_SECONDARY}>
                        {labels.mapUse.replace("{mapped}", acresText(message.map.acres))}
                      </button>
                      <button type="button" onClick={() => onMapAction("plan", message.map)} className={SMALL_PRIMARY}>
                        {labels.mapPlan}
                      </button>
                    </span>
                  ) : null}
                </KaEzyBubble>
              );
          }
        })}
        {thinking ? <ThinkingBubble avatar={avatar} /> : null}
      </div>
    </div>
  );
}

/**
 * A curated advisory video inside Ka-Ezy's answer bubble, under the text,
 * like the app's player card: the player itself, ready to play. It is YouTube's
 * privacy-enhanced embed (youtube-nocookie.com, which sets no cookie until
 * the visitor presses play), loaded lazily as the conversation scrolls to it.
 */
function AdviceVideo({ video, className = "" }: { video: KaEzyVideo; className?: string }) {
  return (
    <figure className={`-mx-1 overflow-hidden rounded-card border border-line bg-card ${className}`}>
      <div className="relative aspect-video bg-inverse">
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
          title={video.title}
          loading="lazy"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <figcaption className="flex items-center justify-between gap-3 px-3 py-2.5">
        <span className="min-w-0">
          <span className="block truncate text-sm font-label text-title">{video.title}</span>
          <span className="block text-xs text-muted">Video · {video.source}</span>
        </span>
        <a
          href={video.url}
          target="_blank"
          rel="noopener"
          data-track="kaezy_try_video_open"
          data-track-video-id={video.youtubeId}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-label text-link underline underline-offset-4"
        >
          YouTube
          <ExternalLink aria-hidden="true" className="size-3.5" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </figcaption>
    </figure>
  );
}

export function HireLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      data-track="kaezy_try_nudge"
      className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-control font-heading text-link hover:underline"
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4" />
    </a>
  );
}

const TYPE_STYLE: Record<FarmRecord["type"], { label: string; bar: string }> = {
  income: { label: "Income", bar: "bg-accent-bright" },
  expense: { label: "Expense", bar: "bg-danger" },
  activity: { label: "Activity", bar: "bg-secondary" },
};

function shortDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Ka-Ezy's "Save this to your farm records?" card, as in the app. */
function RecordCard({
  message,
  onRecord,
  labels,
}: {
  message: Extract<Message, { from: "record" }>;
  onRecord?: (message: Message, save: boolean) => void;
  labels: ThreadLabels;
}) {
  return (
    <div>
      <p className="font-label text-title">{message.text}</p>
      <ul className="mt-3 space-y-2">
        {message.records.map((record, i) => (
          <li key={i} className="flex items-stretch gap-3 rounded-control border border-line bg-card p-3">
            <span aria-hidden="true" className={`w-1.5 shrink-0 rounded-pill ${TYPE_STYLE[record.type].bar}`} />
            <span className="min-w-0 flex-1">
              <span className="block font-label wrap-anywhere text-title">{record.description}</span>
              {record.amount > 0 ? (
                <span className="block font-heading text-title">{formatUgx(record.amount)}</span>
              ) : null}
              <span className="block text-sm text-muted">
                {TYPE_STYLE[record.type].label} · {record.category || "Other"} · {shortDate(record.date)}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {message.status === "pending" && onRecord ? (
        <span className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onRecord(message, true)}
            data-track="kaezy_try_record_save"
            className={SMALL_PRIMARY}
          >
            <Check aria-hidden="true" className="size-4" />
            Save
          </button>
          <button type="button" onClick={() => onRecord(message, false)} className={SMALL_SECONDARY}>
            Not now
          </button>
        </span>
      ) : (
        <p className="mt-2 text-sm font-label text-muted">
          {message.status === "saved" ? labels.recordSaved : message.status === "dismissed" ? labels.recordDismissed : null}
        </p>
      )}
    </div>
  );
}

/**
 * Ka-Ezy's photo check, as the app shows it: what it found, what it sees in
 * the photo and what to do.
 */
function DiagnosisCard({
  diagnosis,
  hireHref,
  labels,
}: {
  diagnosis: Diagnosis;
  hireHref: string;
  labels: ThreadLabels;
}) {
  return (
    <div>
      <p>{diagnosis.intro}</p>
      <div className="mt-3 overflow-hidden rounded-control border border-line bg-card">
        <p className="flex items-center gap-2 border-b border-line px-3 py-2 text-xs text-label-style text-label">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-danger" />
          {diagnosis.kind === "pest" ? labels.pest : labels.disease}
        </p>
        <div className="px-3 py-3 text-sm">
          <p className="text-lg font-heading text-title">{diagnosis.name}</p>
          <p className="text-muted">{diagnosis.crop}</p>
          <p className="mt-3 font-heading text-title">{labels.signs}</p>
          {/* role="list": Safari drops the list role from unstyled lists. */}
          <ul role="list" className="mt-1.5 space-y-1">
            {diagnosis.signs.map((sign) => (
              <li key={sign} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-secondary" />
                {sign}
              </li>
            ))}
          </ul>
          <p className="mt-3 font-heading text-title">{labels.steps}</p>
          <ol role="list" className="mt-1.5 space-y-2">
            {diagnosis.steps.map((step, i) => (
              <li key={step} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-heading text-on-brand"
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">{labels.diagnosisNote}</p>
      <HireLink href={hireHref}>{labels.diagnosisNudge}</HireLink>
    </div>
  );
}

/** The costed plan, as a table, with the season's totals. */
function PlanCard({ plan, hireHref, labels }: { plan: PlanResult; hireHref: string; labels: ThreadLabels }) {
  return (
    <div>
      <p className="font-heading text-title">{plan.title}</p>
      <p className="text-sm text-muted">
        Planting {shortDate(plan.startDate)}
        {plan.variety ? ` · ${plan.variety}` : ""}
      </p>
      <div
        tabIndex={0}
        role="region"
        aria-label={plan.title}
        className="mt-3 overflow-x-auto rounded-control border border-line bg-card focus-visible:outline-offset-2"
      >
        <table className="w-full min-w-[22rem] text-left text-sm">
          <caption className="sr-only">{plan.title}</caption>
          <thead className="bg-brand-soft text-title">
            <tr>
              <th scope="col" className="px-3 py-2 font-label">
                When
              </th>
              <th scope="col" className="px-3 py-2 font-label">
                What
              </th>
              <th scope="col" className="px-3 py-2 text-right font-label">
                Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {plan.rows.map((row, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-3 py-2 whitespace-nowrap text-muted">{row.date}</td>
                <td className="px-3 py-2">{row.label}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{formatUgx(row.cost)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-line font-heading text-title">
            <tr>
              <th scope="row" colSpan={2} className="px-3 py-2 font-heading">
                Total investment
              </th>
              <td className="px-3 py-2 text-right whitespace-nowrap">{formatUgx(plan.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-control bg-card px-3 py-2">
          <dt className="text-muted">Expected harvest</dt>
          <dd className="font-heading text-title">
            {plan.harvest.amount} {plan.harvest.unit}
          </dd>
        </div>
        <div className="rounded-control bg-card px-3 py-2">
          <dt className="text-muted">Expected income</dt>
          <dd className="font-heading text-title">{formatUgx(plan.harvest.income)}</dd>
        </div>
        <div className="rounded-control bg-card px-3 py-2">
          <dt className="text-muted">Expected profit</dt>
          <dd className={`font-heading ${plan.profit >= 0 ? "text-accent" : "text-danger"}`}>
            {formatUgx(plan.profit)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-muted">{labels.planNote}</p>
      <HireLink href={hireHref}>{labels.planNudge}</HireLink>
    </div>
  );
}
