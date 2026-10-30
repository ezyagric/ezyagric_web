"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { acresOf, acresText, fill, type Profile, type TryIt } from "./personalise";
import { buildPlan, todayPlus } from "./plan";
import { KaEzyAskError, type KaEzyChatService } from "./service";
import { demo, newId, type Conversation } from "./store";
import { SMALL_SECONDARY, Thread, type ThreadLabels } from "./Thread";
import { buttonClasses } from "@/components/ui/Button";

const noSubscription = () => () => {};

/**
 * Farm Plan: the app's plan form (crop from "Your farm", variety, land size,
 * planting date, services to budget for), then a costed plan from setup to
 * harvest, scaled to the land. Sample figures for the crops in
 * tryIt.plan.crops; live answers use the app's "farm_plan" mode.
 */
export function PlanPanel({
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
  const p = copy.plan;
  const messages = conversation?.messages ?? [];
  const [editing, setEditing] = useState(false);
  const [variety, setVariety] = useState("");
  // Two weeks from today, worked out in the browser (the page is built ahead of time).
  const defaultStart = useSyncExternalStore(noSubscription, () => todayPlus(14), () => "");
  const [chosenStart, setStartDate] = useState("");
  const startDate = chosenStart || defaultStart;
  const [services, setServices] = useState<string[]>([]);
  // The conversation waiting for Ka-Ezy, if any (the "thinking" bubble shows only there).
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const formHeadingRef = useRef<HTMLParagraphElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const crop = p.crops.find((c) => c.crop === profile.valueChain);
  // A variety picked for another crop no longer applies.
  const chosenVariety = crop?.varieties.includes(variety) ? variety : "";
  const supported = p.crops.map((c) => c.crop.toLowerCase()).join(" and ");
  const showForm = editing || messages.length === 0;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const acres = acresOf(profile);
    if (!profile.valueChain) return setError(p.needCrop);
    if (!acres) return setError(p.needAcres);
    if (!crop && !live) return setError(fill(p.unsupported, profile, { supported }));
    setError("");
    setEditing(false);

    const [y, mo, d] = startDate.split("-").map(Number);
    const planting = new Date(y, mo - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const summary = `Plan ${acresText(acres)} of ${profile.valueChain}${chosenVariety ? ` (${chosenVariety})` : ""}, planting ${planting}`;
    if (pendingId) return;
    const conversationId = demo.append("plan", [{ id: newId(), from: "you", text: summary }], summary);
    setPendingId(conversationId);
    // Focus the conversation now, not when the answer lands (the visitor may have moved on).
    window.setTimeout(() => threadRef.current?.focus({ preventScroll: true }), 0);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (live) {
        // The app's farm plan question: the form as JSON, in "farm_plan" mode.
        const question = JSON.stringify({
          value_chain: profile.valueChain,
          variety: chosenVariety,
          land_size_acres: acres,
          start_date: startDate,
          priority_services: services,
          available_tools: [],
          notes: "",
        });
        const reply = await live.ask(question, controller.signal, {
          mode: "farm_plan",
          profile,
          threadId: demo.threadOf(conversationId),
        });
        if (reply.threadId) demo.setThread(conversationId, reply.threadId);
        demo.appendTo(conversationId, [
          reply.video ? { id: newId(), from: "kaezy", text: reply.text, video: reply.video } : { id: newId(), from: "kaezy", text: reply.text },
        ]);
      } else if (crop) {
        await new Promise((resolve) => window.setTimeout(resolve, 1600));
        if (controller.signal.aborted) return;
        const plan = buildPlan({ copy: p, crop, profile, acres, startDate, variety: chosenVariety, services });
        demo.appendTo(conversationId, [{ id: newId(), from: "plan", plan }]);
      }
    } catch (failure) {
      if (failure instanceof KaEzyAskError) {
        demo.appendTo(conversationId, [
          { id: newId(), from: failure.reason === "limit" ? "limit" : "error", text: copy.chat.errors[failure.reason] },
        ]);
      }
    } finally {
      setPendingId(null);
    }
  }

  if (!showForm) {
    return (
      <>
        <Thread
          threadRef={threadRef}
          messages={messages}
          thinking={pendingId !== null && pendingId === conversation?.id}
          avatar={avatar}
          hireHref={hireHref}
          label="Farm plan from Ka-Ezy"
          labels={labels}
        />
        <div className="border-t border-line bg-card p-3">
          <button
            type="button"
            disabled={pendingId !== null}
            onClick={() => {
              setEditing(true);
              window.setTimeout(() => formHeadingRef.current?.focus({ preventScroll: true }), 0);
            }}
            className={`${SMALL_SECONDARY} w-full disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {p.edit}
          </button>
        </div>
      </>
    );
  }

  const field = "mt-1 min-h-12 w-full rounded-control border-2 border-line bg-canvas px-3 text-base text-title";
  return (
    <form method="dialog" onSubmit={onSubmit} noValidate className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
      <p ref={formHeadingRef} tabIndex={-1} className="text-base text-pretty text-muted">
        {p.intro}
      </p>

      <div className="mt-4 rounded-control bg-subtle px-3 py-2 text-sm">
        <span className="text-muted">Value chain: </span>
        {profile.valueChain ? (
          <span className="font-heading text-title">{profile.valueChain}</span>
        ) : (
          <span className="text-muted">not chosen</span>
        )}{" "}
        <button
          type="button"
          onClick={onChooseValueChain}
          className="min-h-11 cursor-pointer rounded-control px-1 font-label text-link underline"
        >
          {profile.valueChain ? "Change" : "Choose"}
          <span className="sr-only"> value chain in Your farm</span>
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {crop ? (
          <label className="block text-base font-label text-title">
            {p.variety}
            <select value={chosenVariety} onChange={(e) => setVariety(e.target.value)} className={field}>
              <option value="">{p.varietyAny}</option>
              {crop.varieties.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block text-base font-label text-title">
          {copy.farm.landSize}
          <input
            type="text"
            inputMode="decimal"
            value={profile.acres}
            onChange={(e) => demo.setProfile({ acres: e.target.value })}
            placeholder="e.g. 2"
            className={field}
          />
        </label>
        <label className="block text-base font-label text-title">
          {p.startDate}
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} />
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="text-base font-label text-title">{p.services}</legend>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {p.serviceOptions.map((option) => (
            <label key={option.key} className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-body">
              <input
                type="checkbox"
                checked={services.includes(option.key)}
                onChange={(e) =>
                  setServices((list) => (e.target.checked ? [...list, option.key] : list.filter((k) => k !== option.key)))
                }
                className="size-5 shrink-0 accent-secondary"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-label text-danger">
          {error}
        </p>
      ) : null}
      {!crop && profile.valueChain && !live ? (
        <p className="mt-4 text-sm text-muted">{fill(p.unsupported, profile, { supported })}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pendingId !== null}
          data-track="kaezy_try_plan"
          className={`${buttonClasses("primary")} cursor-pointer disabled:opacity-60`}
        >
          {p.submit}
        </button>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              window.setTimeout(() => threadRef.current?.focus({ preventScroll: true }), 0);
            }}
            className={`${buttonClasses("secondary")} cursor-pointer`}
          >
            Back to the plan
          </button>
        ) : null}
      </div>
      {live ? null : <p className="mt-3 text-xs text-muted">{p.sampleNote}</p>}
    </form>
  );
}
