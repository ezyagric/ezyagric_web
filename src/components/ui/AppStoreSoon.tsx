"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { trackData } from "@/lib/track";
import { buttonClasses } from "./Button";
import { POPUP, closeOnBackdrop } from "./Popup";

// Until the iPhone app is live (appStore.url in content/site.yaml), the App
// Store badge is a button that opens this popup. The popup is on the page once
// (root layout, through StoreBadges' AppStoreSoon), however many badges are.
const DIALOG_ID = "app-store-soon";
const TITLE_ID = "app-store-soon-title";
const NOTE_ID = "app-store-soon-note";

/** The badge as a button, in the same place and size as the link it becomes. */
export function AppStoreSoonButton({
  campaign,
  medium,
  children,
}: {
  campaign: string;
  medium: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      // A tap before the scripts arrive still opens it, where browsers know
      // these (React has no props for them yet); onClick is for the others.
      {...{ command: "show-modal", commandfor: DIALOG_ID }}
      onClick={() => (document.getElementById(DIALOG_ID) as HTMLDialogElement | null)?.showModal()}
      {...trackData("app_store_soon_click", { product: campaign, position: medium })}
      className="inline-block cursor-pointer rounded-control"
    >
      {children}
      <span className="sr-only"> (coming soon)</span>
    </button>
  );
}

/**
 * The popup. The closed dialog has no display, so `phone`'s lazy screenshot
 * loads only on opening. It stays in the root layout across pages, so a change
 * of page (the browser's back button) closes it, as it does the site's menus.
 */
export function AppStoreSoonDialog({
  title,
  note,
  close,
  phone,
  playBadge,
}: {
  title: ReactNode;
  note: string;
  close: string;
  phone: ReactNode;
  playBadge: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  return (
    <dialog
      ref={ref}
      id={DIALOG_ID}
      aria-labelledby={TITLE_ID}
      aria-describedby={NOTE_ID}
      onClick={closeOnBackdrop}
      className={`${POPUP} max-w-md`}
    >
      {/* method="dialog": its two buttons close the popup without any script. */}
      <form method="dialog">
        <div className="gradient-brand relative h-44 overflow-hidden">
          {/* Rings spreading from the phone: on their way. */}
          <span
            aria-hidden="true"
            className="absolute top-20 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-on-inverse/20"
          />
          <span
            aria-hidden="true"
            className="absolute top-20 left-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-on-inverse/10"
          />
          <div className="absolute top-6 left-1/2 w-36 -translate-x-1/2 motion-safe:animate-[soon-rise_420ms_ease-out]">
            {phone}
          </div>
          {/* First in the popup, so it takes the focus on opening: Enter just closes. */}
          <button
            type="submit"
            aria-label="Close"
            className="absolute top-3 right-3 flex size-11 cursor-pointer items-center justify-center rounded-pill bg-inverse/25 text-on-inverse transition-colors hover:bg-inverse/50"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="p-6 text-center">
          <h2 id={TITLE_ID} className="text-2xl font-heading text-balance">
            {title}
          </h2>
          <p id={NOTE_ID} className="mt-2 text-base text-balance text-body">
            {note}
          </p>
          {/* gap-3: the badge's clear space (a quarter of its 48px). */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {playBadge}
            <button type="submit" className={`cursor-pointer ${buttonClasses()}`}>
              {close}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
