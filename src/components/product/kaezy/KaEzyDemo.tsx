"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { LogIn, Plus } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { SnackbarHost, snackbar } from "@/components/ui/Snackbar";
import { ExpertPanel, QUESTION_ID } from "./ExpertPanel";
import { FarmDetails, PastConversations, TAB_ICONS } from "./FarmDetails";
import { AccountPanel } from "./AccountPanel";
import { MappingPanel } from "./MappingPanel";
import {
  PARTNER_ENABLED,
  fetchConversation,
  partnerChatService,
  saveRecords,
  useAccount,
  useArrival,
  useRemoteThreads,
  useSession,
  type RemoteThread,
} from "./partner";
import type { TryIt } from "./personalise";
import { PlanPanel } from "./PlanPanel";
import { RecordsPanel } from "./RecordsPanel";
import { liveChatService } from "./service";
import { TABS, demo, hasSavedData, useDemo, type Conversation, type FarmRecord, type Tab } from "./store";
import { KaEzyAvatar, type ThreadLabels } from "./Thread";

/**
 * The Ka-Ezy demo: one panel with "Your farm" and past conversations beside
 * the Ka-Ezy window, whose tabs are the app's Farm Expert (with its photo
 * check), Garden Mapping, Farm Plan and Farm Records. Everything the visitor
 * enters stays on their device; with `endpoint` (the guest demo endpoint)
 * the answers come from the real Ka-Ezy, and so do they once the visitor
 * signs in with an organisation's code and their phone (SignInCard, the
 * Partner API), with their own Ka-Ezy account.
 */
export function KaEzyDemo({
  copy,
  tagline,
  avatar,
  hireHref,
  askId,
  endpoint,
}: {
  copy: TryIt;
  tagline: string;
  avatar: string;
  hireHref: string;
  /** The Ka-Ezy window's id: links to it open Farm Expert, ready for a question. */
  askId: string;
  endpoint: string;
}) {
  const state = useDemo();
  const [tab, setTab] = useState<Tab>("expert");
  const session = useSession();
  // Their name, stage, usage and plan, once signed in; a link's org, phone and token on arrival.
  const account = useAccount();
  const arrival = useArrival();
  // The visitor's conversations on their account, for "Past conversations".
  const remoteThreads = useRemoteThreads();
  const [signInWanted, setSignInWanted] = useState(false);
  // Signed in, the visitor's own Ka-Ezy answers; else the guest endpoint, if any.
  const live = useMemo(
    () => (session ? partnerChatService(session) : endpoint ? liveChatService({ endpoint }) : null),
    [session, endpoint],
  );
  // Records go to the visitor's Farm Records with the organisation too.
  const remote = useMemo(
    () =>
      session
        ? (records: FarmRecord[]) =>
            void saveRecords(session, records).then((saved) => {
              if (saved > 0) snackbar.show(copy.signIn.toasts.recordSaved, "success");
            })
        : null,
    [session, copy.signIn.toasts.recordSaved],
  );
  const valueChainRef = useRef<HTMLSelectElement>(null);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const labels: ThreadLabels = {
    seePlans: "See Ka-Ezy plans",
    planNudge: copy.plan.nudge,
    planNote: copy.plan.sampleNote,
    recordSaved: copy.records.saved,
    recordDismissed: copy.records.dismissed,
    mapUse: copy.mapping.useSize,
    mapPlan: copy.mapping.planIt,
    pest: copy.diagnosis.pest,
    disease: copy.diagnosis.disease,
    signs: copy.diagnosis.signs,
    steps: copy.diagnosis.steps,
    diagnosisNote: copy.diagnosis.sampleNote,
    diagnosisNudge: copy.diagnosis.nudge,
    signIn: copy.signIn.open,
  };
  const current = (t: Tab) => state.conversations.find((c) => c.id === state.current[t]);
  const openIds = TABS.map((t) => state.current[t]).filter((id): id is string => !!id);

  // "Ask Ka-Ezy" links (#askId) open Farm Expert with the cursor in its
  // question box, on a click here or on arrival from another page. The box
  // is at the foot of the 44rem window, so when the whole window doesn't fit
  // under the sticky header the page scrolls to the window's foot, not its
  // top. Modifier clicks (a new tab or window) are left to the browser, and
  // on a reload or back/forward the browser's own scroll position stands.
  // Arriving from another page of the site counts however the document was
  // first loaded (a client-side navigation leaves that entry behind).
  useEffect(() => {
    const hash = `#${askId}`;
    function reveal() {
      const win = document.getElementById(askId);
      const input = document.getElementById(QUESTION_ID);
      if (!win || !input) return;
      input.focus({ preventScroll: true });
      // The [id] rule's scroll margin clears the sticky header.
      const margin = parseFloat(getComputedStyle(win).scrollMarginTop) || 0;
      win.scrollIntoView({ block: win.offsetHeight + margin <= window.innerHeight ? "start" : "end" });
    }
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const clientArrival = !!entry && new URL(entry.name).pathname !== window.location.pathname;
    if (window.location.hash === hash && (!entry || entry.type === "navigate" || clientArrival)) {
      requestAnimationFrame(reveal);
    }
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element) || !event.target.closest(`a[href$="${hash}"]`)) return;
      event.preventDefault();
      if (window.location.hash !== hash) window.history.pushState(null, "", hash);
      flushSync(() => setTab("expert"));
      reveal();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [askId]);

  function chooseValueChain() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    valueChainRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    valueChainRef.current?.focus({ preventScroll: true });
  }

  function show(next: Tab, focusTab = false) {
    setTab(next);
    if (focusTab) tabRefs.current[next]?.focus();
  }

  /** A conversation from the account: fetch it, put it in the list, open it. */
  async function openRemote(thread: RemoteThread) {
    const busy = snackbar.show(copy.signIn.toasts.loadingConversation, "busy");
    try {
      const conversation = await fetchConversation(thread);
      demo.importConversation(conversation);
      snackbar.dismiss(busy);
      show(conversation.tab, true);
    } catch {
      snackbar.show(copy.chat.errors.busy, "error");
    }
  }

  // Arrow keys move between tabs (the ARIA tabs pattern).
  function onTabKey(event: KeyboardEvent) {
    const i = TABS.indexOf(tab);
    const next =
      event.key === "ArrowRight" ? TABS[(i + 1) % TABS.length]
      : event.key === "ArrowLeft" ? TABS[(i - 1 + TABS.length) % TABS.length]
      : event.key === "Home" ? TABS[0]
      : event.key === "End" ? TABS[TABS.length - 1]
      : null;
    if (!next) return;
    event.preventDefault();
    show(next, true);
  }

  const shared = { copy, profile: state.profile, avatar, hireHref, labels };

  return (
    <>
    {/* grid-cols-1 (minmax(0, 1fr)): no child can push the page wider than a phone. */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-8">
      {/* "Your farm" and past conversations, one panel: stacked on phones,
          side by side from md, and from lg down the side of the Ka-Ezy
          window, as tall as it, past conversations filling the rest. Hire
          Ka-Ezy's navy column below is as wide (HireKaEzy). */}
      <div className="flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-card md:max-lg:grid md:max-lg:grid-cols-2 lg:h-[44rem]">
        <FarmDetails copy={copy} profile={state.profile} live={!!live} valueChainRef={valueChainRef} className="p-5" />
        <PastConversations
          copy={copy}
          conversations={state.conversations}
          openIds={openIds}
          hasData={hasSavedData(state)}
          onOpen={(conversation: Conversation) => {
            demo.open(conversation);
            show(conversation.tab, true);
          }}
          remote={PARTNER_ENABLED ? remoteThreads : null}
          onOpenRemote={(thread) => void openRemote(thread)}
          className="min-h-0 flex-1 border-t border-line bg-subtle p-5 md:max-lg:border-t-0 md:max-lg:border-l"
        />
      </div>

      {/* The Ka-Ezy window. */}
      <div id={askId} className="flex h-[44rem] flex-col overflow-hidden rounded-card border border-line bg-card shadow-raised">
        <div className="flex items-center gap-3 bg-brand px-4 py-3 text-on-brand">
          <KaEzyAvatar src={avatar} size="lg" />
          <span className="min-w-0 flex-1">
            {/* Numbered 1: the hire card's pay header below is 2. */}
            <span className="block text-lg font-heading">
              <span className="tabular-nums">1.</span> {copy.windowTitle}
            </span>
            <span className="block text-sm leading-snug text-on-brand/85">{tagline}</span>
          </span>
          {PARTNER_ENABLED && !session ? (
            // Opens the sign-in form in the account band under the window.
            <button
              type="button"
              onClick={() => setSignInWanted(true)}
              data-track="kaezy_sign_in_open"
              className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-pill border border-on-brand/40 px-3 text-xs font-label transition-colors hover:bg-on-brand/15 focus-visible:outline-focus-inverse"
            >
              <LogIn aria-hidden="true" className="size-4" />
              {copy.signIn.open}
            </button>
          ) : (
            <span className="hidden shrink-0 rounded-pill border border-on-brand/40 px-2.5 py-0.5 text-xs font-label sm:inline">
              {session ? (session.organisation.sandbox ? "Live · test" : "Live") : live ? "Live demo" : "Sample answers"}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              demo.newConversation(tab);
              // The button disables itself: keep focus on the tab.
              tabRefs.current[tab]?.focus();
            }}
            disabled={!current(tab)}
            aria-label={`${copy.farm.newConversation}: ${copy.tabs[tab].title}`}
            title={copy.farm.newConversation}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-on-brand/40 transition-colors hover:bg-on-brand/15 focus-visible:outline-focus-inverse disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div role="tablist" aria-label="Ka-Ezy features" className="grid grid-cols-2 border-b border-line sm:grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t}
              ref={(el) => {
                tabRefs.current[t] = el;
              }}
              type="button"
              role="tab"
              id={`kaezy-tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`kaezy-panel-${t}`}
              tabIndex={tab === t ? 0 : -1}
              onClick={() => show(t)}
              onKeyDown={onTabKey}
              data-track="kaezy_try_tab"
              data-track-tab={t}
              className={`flex min-h-12 cursor-pointer items-center justify-center gap-1.5 border-b-2 px-2 text-sm font-label transition-colors focus-visible:-outline-offset-2 ${
                tab === t ? "border-secondary bg-brand-soft text-title" : "border-transparent text-muted hover:text-title"
              }`}
            >
              <Icon name={TAB_ICONS[t]} className="size-4 shrink-0" />
              {copy.tabs[t].title}
            </button>
          ))}
        </div>
        <p className="border-b border-line px-4 py-2 text-sm text-muted">
          {/* The header's "Sample answers" pill has no room on phones. */}
          {live ? null : <span className="font-label sm:hidden">Sample answers. </span>}
          {copy.tabs[tab].text}
        </p>

        {TABS.map((t) => (
          // All panels stay mounted, so an answer still arrives after switching tabs.
          <div
            key={t}
            role="tabpanel"
            id={`kaezy-panel-${t}`}
            aria-labelledby={`kaezy-tab-${t}`}
            className={tab === t ? "flex min-h-0 flex-1 flex-col" : "hidden"}
          >
            {t === "expert" ? (
              <ExpertPanel
                {...shared}
                conversation={current(t)}
                live={live}
                onChooseValueChain={chooseValueChain}
                onSignIn={PARTNER_ENABLED && !session ? () => setSignInWanted(true) : undefined}
              />
            ) : t === "plan" ? (
              <PlanPanel {...shared} conversation={current(t)} live={live} onChooseValueChain={chooseValueChain} />
            ) : t === "records" ? (
              // Signed in, records are read from what the visitor types (as with
              // sample answers) and saved to their account too; Ka-Ezy's chat
              // does not propose records through the Partner API.
              <RecordsPanel {...shared} conversation={current(t)} records={state.records} live={session ? null : live} remote={remote} />
            ) : (
              <MappingPanel {...shared} conversation={current(t)} onPlan={() => show("plan", true)} />
            )}
          </div>
        ))}
      </div>
    </div>

    {/* "Your Ka-Ezy account": only for a signed-in visitor (or the sign-in
        form, when asked for). Full width under the window, the demo's own gap. */}
    {PARTNER_ENABLED ? (
      <AccountPanel
        copy={copy.signIn}
        session={session}
        account={account}
        arrival={arrival}
        profile={state.profile}
        wanted={signInWanted}
        hireHref={hireHref}
        className="mt-6 lg:mt-8"
      />
    ) : null}
    {PARTNER_ENABLED ? <SnackbarHost /> : null}
    </>
  );
}
