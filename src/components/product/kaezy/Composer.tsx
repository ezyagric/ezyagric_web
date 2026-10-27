"use client";

import { useState, type FormEvent, type MouseEvent, type RefObject } from "react";
import { SendHorizontal } from "lucide-react";

/**
 * The message box at the bottom of a tab: a text field and a send button.
 * method="dialog": before the scripts load, Enter does nothing instead of
 * reloading the page.
 */
export function Composer({
  id,
  label,
  placeholder,
  disabled,
  onSend,
  inputRef,
  track,
}: {
  id: string;
  label: string;
  placeholder: string;
  disabled: boolean;
  onSend: (text: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  track: string;
}) {
  const [draft, setDraft] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (disabled || !draft.trim()) return;
    const text = draft;
    setDraft("");
    onSend(text);
  }

  return (
    <form method="dialog" onSubmit={onSubmit} className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        maxLength={300}
        autoComplete="off"
        className="min-h-12 min-w-0 flex-1 rounded-pill border border-line bg-canvas px-4 text-base text-title placeholder:text-muted"
      />
      <button
        type="submit"
        disabled={disabled || !draft.trim()}
        aria-label="Send"
        data-track={track}
        className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SendHorizontal aria-hidden="true" className="size-5" />
      </button>
    </form>
  );
}

/**
 * Suggested messages as pills: one swipeable row on phones (so they don't
 * squeeze the conversation), wrapping from sm. py-1 keeps focus rings clear.
 */
export function Chips({
  label,
  items,
  disabled,
  onPick,
  track,
}: {
  label: string;
  items: string[];
  disabled: boolean;
  onPick: (event: MouseEvent, text: string) => void;
  track: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul
      aria-label={label}
      className="mb-2 flex gap-2 overflow-x-auto py-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item, i) => (
        <li key={item} className="shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={(event) => onPick(event, item)}
            data-track={track}
            data-track-item={String(i + 1)}
            className="min-h-11 cursor-pointer rounded-pill border border-line bg-card px-3 py-1.5 text-left text-sm font-label whitespace-nowrap text-title transition-colors hover:border-secondary hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}
