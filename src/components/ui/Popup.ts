import type { MouseEvent } from "react";

/**
 * The site's popups are native modal <dialog>s (showModal): above everything
 * on the page, keyboard focus kept inside, Esc closes them and focus goes back
 * to what opened them. This is their look. Keep display utilities off the
 * <dialog> itself: they would show it while closed.
 */
export const POPUP =
  "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto overscroll-contain rounded-card bg-card shadow-lift backdrop:bg-inverse/70 backdrop:backdrop-blur-sm open:motion-safe:animate-[popup-in_260ms_ease-out] motion-safe:backdrop:animate-[popup-fade_200ms_ease-out]";

/**
 * A tap on the backdrop closes the popup: only the backdrop hits the <dialog>
 * itself, since its content fills it. Not the second click of a double-click
 * on what opened it, which would close it the moment it opens.
 */
export function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
  if (event.target === event.currentTarget && event.detail < 2) event.currentTarget.close();
}
