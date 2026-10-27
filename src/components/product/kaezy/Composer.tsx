"use client";

import { useRef, useState, type FormEvent, type MouseEvent, type RefObject } from "react";
import { Camera, SendHorizontal, X } from "lucide-react";
import type { Photo } from "./store";

/** A photo button beside the text field (Farm Expert's photo check). */
export type Attach = {
  /** The button's name, e.g. "Add a photo of a sick crop or animal". */
  label: string;
  removeLabel: string;
  /** The photo waiting to be sent, if any. */
  photo: Photo | null;
  /** Beside the waiting photo: what to do next, and where the photo goes. */
  hint: string;
  note: string;
  /** `keyboard`: the button was pressed from the keyboard, not tapped. */
  onAdd: (keyboard: boolean) => void;
  onRemove: () => void;
};

/**
 * The message box at the bottom of a tab: a text field and a send button,
 * with a photo button first when `attach` is given (a waiting photo shows
 * above, and can be sent without any text). method="dialog": before the
 * scripts load, Enter does nothing instead of reloading the page.
 */
export function Composer({
  id,
  label,
  placeholder,
  disabled,
  onSend,
  inputRef,
  track,
  attach,
  attachRef,
}: {
  id: string;
  label: string;
  placeholder: string;
  disabled: boolean;
  onSend: (text: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  track: string;
  attach?: Attach;
  /** The photo button (focus goes back to it when the waiting photo is removed). */
  attachRef?: RefObject<HTMLButtonElement | null>;
}) {
  const [draft, setDraft] = useState("");
  // Send pressed from the keyboard: it disables itself once sent, so focus goes to the text field.
  const sentByKey = useRef(false);
  const photo = attach?.photo ?? null;
  const empty = !draft.trim() && !photo;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (disabled || empty) return;
    const text = draft;
    setDraft("");
    onSend(text);
    if (sentByKey.current) inputRef.current?.focus();
    sentByKey.current = false;
  }

  return (
    <form method="dialog" onSubmit={onSubmit}>
      {attach && photo ? (
        <div className="mb-2 flex items-center gap-3 rounded-control border border-line bg-subtle p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- the visitor's own photo, a data URL */}
          <img src={photo.src} alt={photo.alt} className="size-12 shrink-0 rounded-control object-cover" />
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-label text-title">{attach.hint}</span>
            <span className="block text-muted">{attach.note}</span>
          </span>
          <button
            type="button"
            onClick={attach.onRemove}
            aria-label={attach.removeLabel}
            title={attach.removeLabel}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-title"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        {attach ? (
          <button
            ref={attachRef}
            type="button"
            onClick={(event) => attach.onAdd(event.detail === 0)}
            aria-label={attach.label}
            title={attach.label}
            data-track="kaezy_try_photo"
            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-secondary transition-colors hover:border-secondary hover:bg-brand-soft"
          >
            <Camera aria-hidden="true" className="size-5" />
          </button>
        ) : null}
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
          onClick={(event) => {
            sentByKey.current = event.detail === 0;
          }}
          disabled={disabled || empty}
          aria-label="Send"
          data-track={track}
          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendHorizontal aria-hidden="true" className="size-5" />
        </button>
      </div>
    </form>
  );
}

/**
 * Suggested messages as pills: one swipeable row on phones (so they don't
 * squeeze the conversation), wrapping from sm. py-1 keeps focus rings clear.
 * An item with a photo (`photoOf`: a sample photo to check) shows as just
 * that photo, round, so the row stays short; its text is the button's name,
 * after the photo's `label`, and its tooltip. It can have its own analytics
 * event and item.
 */
export function Chips({
  label,
  items,
  disabled,
  onPick,
  track,
  photoOf,
}: {
  label: string;
  items: string[];
  disabled: boolean;
  onPick: (event: MouseEvent, text: string) => void;
  track: string;
  photoOf?: (item: string) => { src: string; label: string; track?: string; item?: string } | undefined;
}) {
  if (items.length === 0) return null;
  return (
    <ul
      aria-label={label}
      className="mb-2 flex gap-2 overflow-x-auto py-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item, i) => {
        const photo = photoOf?.(item);
        return (
          <li key={item} className="shrink-0">
            {photo ? (
              <button
                type="button"
                disabled={disabled}
                onClick={(event) => onPick(event, item)}
                aria-label={`${photo.label}: ${item}`}
                title={item}
                data-track={photo.track ?? track}
                data-track-item={photo.item ?? String(i + 1)}
                className="block size-11 cursor-pointer overflow-hidden rounded-full ring-1 ring-line transition hover:ring-2 hover:ring-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small static sample photo */}
                <img src={photo.src} alt="" width={44} height={44} className="size-full object-cover" />
              </button>
            ) : (
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
            )}
          </li>
        );
      })}
    </ul>
  );
}
