"use client";

import { useRef, useState, type RefObject } from "react";
import { History, MessageCircle, Sprout } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/lib/content";
import type { Profile, TryIt } from "./personalise";
import { demo, type Conversation, type Tab } from "./store";

export const TAB_ICONS: Record<Tab, IconName> = {
  expert: "message-circle",
  plan: "calendar",
  records: "clipboard-list",
  mapping: "map",
};

const FIELD =
  "min-h-12 w-full min-w-0 rounded-control border-2 border-line bg-canvas px-3 text-base text-title placeholder:text-muted";
const LABEL = "block text-sm font-label text-title";

/**
 * "Your farm": the value chain and optional farm details that personalise
 * every tab (starter questions, answers, the plan). Kept on this device.
 * The top half of the panel beside the Ka-Ezy window (KaEzyDemo), so it has
 * no card of its own; location and land size share a row to keep it short.
 */
export function FarmDetails({
  copy,
  profile,
  live,
  valueChainRef,
  className = "",
}: {
  copy: TryIt;
  profile: Profile;
  live: boolean;
  valueChainRef: RefObject<HTMLSelectElement | null>;
  className?: string;
}) {
  const f = copy.farm;
  return (
    <section aria-labelledby="kaezy-farm-title" className={className}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
        >
          <Sprout className="size-5" />
        </span>
        <h3 id="kaezy-farm-title" className="text-lg font-heading text-title">
          {f.title}
        </h3>
      </div>

      <label htmlFor="kaezy-farm-value-chain" className={`mt-4 ${LABEL}`}>
        {f.valueChain}
        <span aria-hidden="true"> *</span>
      </label>
      <select
        ref={valueChainRef}
        id="kaezy-farm-value-chain"
        value={profile.valueChain}
        onChange={(event) => demo.setProfile({ valueChain: event.target.value })}
        aria-required="true"
        className={`mt-1 ${FIELD}`}
      >
        <option value="">{f.valueChainPlaceholder}</option>
        {copy.valueChains.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.items.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <p className="mt-4 text-sm text-label-style text-label">{f.optionalTitle}</p>
      {/* Location and land size side by side; their labels share a row
          (subgrid), so the fields line up even if one label wraps. The
          location hint runs under both. */}
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        <Field
          id="kaezy-farm-location"
          label={f.location}
          hint={f.locationHint}
          value={profile.location}
          autoComplete="address-level2"
          onChange={(location) => demo.setProfile({ location })}
        />
        <Field
          id="kaezy-farm-acres"
          label={f.landSize}
          value={profile.acres}
          inputMode="decimal"
          onChange={(acres) => demo.setProfile({ acres })}
        />
        <p id="kaezy-farm-location-hint" className="col-span-2 text-xs text-muted">
          {f.locationHint}
        </p>
      </div>
      <div className="mt-3 grid gap-y-1">
        <Field
          id="kaezy-farm-name"
          label={f.firstName}
          hint={f.firstNameHint}
          value={profile.name}
          autoComplete="given-name"
          onChange={(name) => demo.setProfile({ name })}
        />
        <p id="kaezy-farm-name-hint" className="text-xs text-muted">
          {f.firstNameHint}
        </p>
      </div>
      <p className="mt-4 text-xs text-muted">{live ? f.storageLive : f.storage}</p>
    </section>
  );
}

/** A label above its field, as two rows of the grid around it (subgrid). Its hint is the grid's. */
function Field({
  id,
  label,
  hint,
  value,
  onChange,
  autoComplete,
  inputMode,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  inputMode?: "decimal";
}) {
  return (
    <div className="row-span-2 grid grid-rows-subgrid gap-y-1">
      <label htmlFor={id} className={`self-end ${LABEL}`}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={60}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD}
      />
    </div>
  );
}

function when(at: number): string {
  const day = new Date(at);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (day.toDateString() === today.toDateString()) return "Today";
  if (day.toDateString() === yesterday.toDateString()) return "Yesterday";
  return day.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Past conversations on this device: open one to carry on, or delete them
 * all. The bottom half of the panel beside the Ka-Ezy window: from lg it
 * fills the rest of the panel's height and the list scrolls inside it;
 * elsewhere the list scrolls past a few conversations.
 */
export function PastConversations({
  copy,
  conversations,
  openIds,
  hasData,
  onOpen,
  className = "",
}: {
  copy: TryIt;
  conversations: Conversation[];
  /** The conversation open in each tab. */
  openIds: string[];
  /** Anything saved on this device (farm details count too), so "Delete all" has something to delete. */
  hasData: boolean;
  onOpen: (conversation: Conversation) => void;
  className?: string;
}) {
  const f = copy.farm;
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  return (
    <section aria-labelledby="kaezy-past-title" className={`flex flex-col ${className}`}>
      <h3
        ref={headingRef}
        tabIndex={-1}
        id="kaezy-past-title"
        className="flex items-center gap-2 text-sm text-label-style text-label"
      >
        <History aria-hidden="true" className="size-4 shrink-0" />
        {f.pastTitle}
      </h3>
      <p role="status" className="sr-only">
        {status}
      </p>
      {conversations.length === 0 ? (
        // Just the line on phones, where the Ka-Ezy window comes next.
        <div className="flex flex-1 flex-col items-center justify-center gap-2 pt-3 text-center md:py-6">
          <span
            aria-hidden="true"
            className="hidden size-10 items-center justify-center rounded-full bg-card text-muted ring-1 ring-line md:flex"
          >
            <MessageCircle className="size-5" />
          </span>
          <p className="text-sm text-muted">{f.pastEmpty}</p>
        </div>
      ) : (
        // -mx-2 px-2: room for the open conversation's bar and the focus ring inside the scroll area.
        <ul className="-mx-2 mt-2 max-h-72 min-h-0 space-y-1 overflow-y-auto px-2 py-1 lg:max-h-none lg:flex-1">
          {conversations.map((conversation) => {
            const open = openIds.includes(conversation.id);
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onOpen(conversation)}
                  aria-current={open ? "true" : undefined}
                  // The open one has a bar as well as the white (white alone is the hover look).
                  className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control border-l-4 px-2 py-1.5 text-left transition-colors hover:bg-card ${
                    open ? "border-secondary bg-card shadow-card" : "border-transparent"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-secondary ring-1 ring-line"
                  >
                    <Icon name={TAB_ICONS[conversation.tab]} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-label text-title">{conversation.title}</span>
                    <span className="block text-xs text-muted">
                      {copy.tabs[conversation.tab].title} · {when(conversation.at)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {/* At the foot of the list (beside the title there's no room in the
          narrow column), at the panel's bottom edge from lg. */}
      {hasData ? (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            // Two steps: the first press asks, the second deletes. Leaving the
            // button cancels.
            onBlur={() => setConfirming(false)}
            onClick={() => {
              if (confirming) {
                demo.clearAll();
                setConfirming(false);
                setStatus("Everything saved on this device was deleted.");
                window.setTimeout(() => headingRef.current?.focus(), 0);
              } else {
                setConfirming(true);
                setStatus("");
              }
            }}
            className="min-h-11 shrink-0 cursor-pointer rounded-control px-2 text-sm font-label whitespace-nowrap text-link hover:underline"
          >
            {confirming ? "Tap again to delete" : f.clear}
          </button>
        </div>
      ) : null}
    </section>
  );
}
