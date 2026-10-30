"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CheckCircle2, CircleAlert, Info, Loader2, X } from "lucide-react";

// A snackbar: one short line at the foot of the screen that says what just
// happened or is happening ("Signing you in…", "Signed in", "Code sent"),
// then goes away. One at a time; a new one replaces the current one. Show
// one from anywhere with `snackbar.show(...)`; render `<SnackbarHost />`
// once on the page. It is announced to screen readers (a polite live
// region), so it never needs a duplicate sr-only status line.

export type SnackTone = "info" | "success" | "error" | "busy";

export type Snack = {
  id: number;
  text: string;
  tone: SnackTone;
  /** ms before it goes on its own; 0 keeps it until replaced or dismissed. */
  duration: number;
};

let current: Snack | null = null;
let counter = 0;
let timer: number | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const DURATION: Record<SnackTone, number> = { info: 4000, success: 4000, error: 6000, busy: 0 };

export const snackbar = {
  /** Show `text`; returns its id, so a `busy` one can be cleared when the work ends. */
  show(text: string, tone: SnackTone = "info", duration = DURATION[tone]): number {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    counter += 1;
    current = { id: counter, text, tone, duration };
    if (duration > 0) {
      timer = window.setTimeout(() => {
        if (current?.id === counter) {
          current = null;
          notify();
        }
      }, duration);
    }
    notify();
    return counter;
  },

  /** Remove the snack with `id` if it is still showing (or any, with no id). */
  dismiss(id?: number) {
    if (!current || (id !== undefined && current.id !== id)) return;
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    current = null;
    notify();
  },
};

export function useSnackbar(): Snack | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

const ICONS: Record<SnackTone, typeof Info> = { info: Info, success: CheckCircle2, error: CircleAlert, busy: Loader2 };

/**
 * The one place snacks appear: fixed at the foot of the screen, above the
 * page's own bottom bars, narrow on phones and a card on wider screens. Always
 * mounted, so the live region exists before the first message.
 */
export function SnackbarHost() {
  const snack = useSnackbar();

  // Escape dismisses, as a dialog would.
  useEffect(() => {
    if (!snack) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") snackbar.dismiss();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [snack]);

  const Icon = snack ? ICONS[snack.tone] : Info;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-6"
    >
      {snack ? (
        <div
          key={snack.id}
          className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-card border bg-brand px-4 py-3 text-on-brand shadow-raised motion-safe:animate-[snack-in_200ms_ease-out] ${
            snack.tone === "error" ? "border-danger" : snack.tone === "success" ? "border-accent-bright" : "border-on-brand/20"
          }`}
        >
          <Icon
            aria-hidden="true"
            className={`size-5 shrink-0 ${
              snack.tone === "error"
                ? "text-danger"
                : snack.tone === "success"
                  ? "text-accent-bright"
                  : snack.tone === "busy"
                    ? "motion-safe:animate-spin"
                    : ""
            }`}
          />
          <p className="min-w-0 flex-1 text-sm font-label">{snack.text}</p>
          <button
            type="button"
            onClick={() => snackbar.dismiss()}
            aria-label="Dismiss"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-on-brand/15 focus-visible:outline-focus-inverse"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
