"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { ExpertPanel } from "./ExpertPanel";
import { FarmDetails, PastConversations, TAB_ICONS } from "./FarmDetails";
import { MappingPanel } from "./MappingPanel";
import type { TryIt } from "./personalise";
import { PlanPanel } from "./PlanPanel";
import { RecordsPanel } from "./RecordsPanel";
import { liveChatService } from "./service";
import { TABS, demo, hasSavedData, useDemo, type Conversation, type Tab } from "./store";
import { KaEzyAvatar, type ThreadLabels } from "./Thread";

/**
 * The Ka-Ezy demo: "Your farm" and past conversations beside the Ka-Ezy
 * window, whose tabs are the app's Farm Expert, Farm Plan, Farm Records and
 * Garden Mapping. Everything the visitor enters stays on their device; with
 * `endpoint` (the guest demo endpoint) the answers come from the real Ka-Ezy.
 */
export function KaEzyDemo({
  copy,
  tagline,
  avatar,
  hireHref,
  endpoint,
}: {
  copy: TryIt;
  tagline: string;
  avatar: string;
  hireHref: string;
  endpoint: string;
}) {
  const state = useDemo();
  const [tab, setTab] = useState<Tab>("expert");
  const live = useMemo(() => (endpoint ? liveChatService({ endpoint }) : null), [endpoint]);
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
  };
  const current = (t: Tab) => state.conversations.find((c) => c.id === state.current[t]);
  const openIds = TABS.map((t) => state.current[t]).filter((id): id is string => !!id);

  function chooseValueChain() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    valueChainRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    valueChainRef.current?.focus({ preventScroll: true });
  }

  function show(next: Tab, focusTab = false) {
    setTab(next);
    if (focusTab) tabRefs.current[next]?.focus();
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
    // grid-cols-1 (minmax(0, 1fr)): no child can push the page wider than a phone.
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-8">
      <FarmDetails
        copy={copy}
        profile={state.profile}
        live={!!live}
        valueChainRef={valueChainRef}
        className="lg:col-start-1 lg:row-start-1"
      />

      {/* The Ka-Ezy window. */}
      <div className="flex h-[44rem] flex-col overflow-hidden rounded-card border border-line bg-card shadow-raised lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="flex items-center gap-3 bg-brand px-4 py-3 text-on-brand">
          <KaEzyAvatar src={avatar} size="lg" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-heading">Ka-Ezy</span>
            <span className="block text-sm leading-snug text-on-brand/85">{tagline}</span>
          </span>
          <span className="hidden shrink-0 rounded-pill border border-on-brand/40 px-2.5 py-0.5 text-xs font-label sm:inline">
            {live ? "Live demo" : "Sample answers"}
          </span>
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
              <ExpertPanel {...shared} conversation={current(t)} live={live} onChooseValueChain={chooseValueChain} />
            ) : t === "plan" ? (
              <PlanPanel {...shared} conversation={current(t)} live={live} onChooseValueChain={chooseValueChain} />
            ) : t === "records" ? (
              <RecordsPanel {...shared} conversation={current(t)} records={state.records} live={live} />
            ) : (
              <MappingPanel {...shared} conversation={current(t)} onPlan={() => show("plan", true)} />
            )}
          </div>
        ))}
      </div>

      <PastConversations
        copy={copy}
        conversations={state.conversations}
        openIds={openIds}
        hasData={hasSavedData(state)}
        onOpen={(conversation: Conversation) => {
          demo.open(conversation);
          show(conversation.tab, true);
        }}
        className="lg:col-start-1 lg:row-start-2 lg:self-start"
      />
    </div>
  );
}
