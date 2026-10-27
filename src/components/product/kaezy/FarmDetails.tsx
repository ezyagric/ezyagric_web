"use client";

import { useRef, useState, type RefObject } from "react";
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
  "mt-1 min-h-12 w-full rounded-control border-2 border-line bg-canvas px-3 text-base text-title placeholder:text-muted";

/**
 * "Your farm": the value chain and optional farm details that personalise
 * every tab (starter questions, answers, the plan). Kept on this device.
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
    <section
      aria-labelledby="kaezy-farm-title"
      className={`rounded-card border border-line bg-card p-5 shadow-card ${className}`}
    >
      <h3 id="kaezy-farm-title" className="text-lg font-heading text-title">
        {f.title}
      </h3>

      <label htmlFor="kaezy-farm-value-chain" className="mt-4 block text-base font-label text-title">
        {f.valueChain}
        <span aria-hidden="true"> *</span>
      </label>
      <select
        ref={valueChainRef}
        id="kaezy-farm-value-chain"
        value={profile.valueChain}
        onChange={(event) => demo.setProfile({ valueChain: event.target.value })}
        aria-required="true"
        className={FIELD}
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

      <p className="mt-5 text-sm text-label-style text-label">{f.optionalTitle}</p>
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
      <Field
        id="kaezy-farm-name"
        label={f.firstName}
        hint={f.firstNameHint}
        value={profile.name}
        autoComplete="given-name"
        onChange={(name) => demo.setProfile({ name })}
      />
      <p className="mt-4 text-xs text-muted">{live ? f.storageLive : f.storage}</p>
    </section>
  );
}

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
    <div className="mt-3">
      <label htmlFor={id} className="block text-base font-label text-title">
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
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
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

/** Past conversations on this device: open one to carry on, or delete them all. */
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
    <section
      aria-labelledby="kaezy-past-title"
      className={`rounded-card border border-line bg-card p-5 shadow-card ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 ref={headingRef} tabIndex={-1} id="kaezy-past-title" className="text-sm text-label-style text-label">
          {f.pastTitle}
        </h3>
        {hasData ? (
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
        ) : null}
      </div>
      <p role="status" className="sr-only">
        {status}
      </p>
      {conversations.length === 0 ? (
        <p className="py-6 text-center text-base text-muted">{f.pastEmpty}</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {conversations.map((conversation) => {
            const open = openIds.includes(conversation.id);
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onOpen(conversation)}
                  aria-current={open ? "true" : undefined}
                  // The open one has a bar as well as the tint (the tint alone is the hover look).
                  className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control border-l-4 px-2 py-1.5 text-left transition-colors hover:bg-brand-soft ${
                    open ? "border-secondary bg-brand-soft" : "border-transparent"
                  }`}
                >
                  <Icon name={TAB_ICONS[conversation.tab]} className="size-4 shrink-0 text-secondary" />
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
    </section>
  );
}
