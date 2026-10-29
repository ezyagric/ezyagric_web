"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { track } from "@/lib/track";
import { buttonClasses } from "@/components/ui/Button";
import { CONSENT_STORAGE_KEY, GA_ENABLED, GA_ID, OPEN_CONSENT_EVENT } from "./config";

// Google Analytics 4, loaded only after the visitor taps "Accept".
//
// - Before a choice is made, or after "No thanks", no Google script is
//   requested and no cookie is set.
// - The choice is kept in localStorage. Every access is wrapped in try/catch
//   because storage can be blocked (private mode, strict browser settings);
//   the choice then lasts until the page is closed.
// - Clicks on any element with data-track="event" (plus data-track-<param>)
//   are sent as GA events through one listener on the document.

type Consent = "granted" | "denied";
/** "unset" = no choice yet; "unknown" = server render, before storage can be read. */
type Snapshot = Consent | "unset" | "unknown";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// --- Consent store (read with useSyncExternalStore) -------------------------

let memoryConsent: Consent | null = null;
const listeners = new Set<() => void>();

function readConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    // Storage blocked: fall back to the in-memory choice below.
  }
  return memoryConsent;
}

function saveConsent(value: Consent): void {
  memoryConsent = value;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Storage blocked: the choice lasts for this page view only.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  // Keeps several open tabs in step.
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

const getSnapshot = (): Snapshot => readConsent() ?? "unset";
const getServerSnapshot = (): Snapshot => "unknown";

// --- Google Analytics -------------------------------------------------------

const DISABLE_FLAG = `ga-disable-${GA_ID}`;
let gaQueued = false;

/** Queues the consent and config commands; gtag.js reads them when it loads. */
function enableGa(): void {
  (window as unknown as Record<string, unknown>)[DISABLE_FLAG] = false;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // gtag.js expects the `arguments` object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
  if (!gaQueued) {
    // Consent Mode v2: everything denied by default, then only analytics
    // storage granted. Ads features stay off.
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    gaQueued = true;
  }
  window.gtag("consent", "update", { analytics_storage: "granted" });
}

/** Stops GA for the rest of the visit and removes its cookies. */
function disableGa(): void {
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
  (window as unknown as Record<string, unknown>)[DISABLE_FLAG] = true;
  // track() checks for window.gtag, so events stop here too.
  delete window.gtag;

  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));
  // GA sets its cookies on the widest domain it can (e.g. .ezyagric.com),
  // so try every parent domain of this host.
  const parts = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) {
    domains.push(`; domain=.${parts.slice(i).join(".")}`);
  }
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
    }
  }
}

/** data-track="get_app_click" data-track-position="hero" -> track("get_app_click", { position: "hero" }) */
function onDocumentClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return;
  const el = event.target.closest("[data-track]");
  const name = el?.getAttribute("data-track");
  if (!el || !name) return;

  const params: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("data-track-")) {
      params[attr.name.slice("data-track-".length).replace(/-/g, "_")] = attr.value;
    }
  }
  // Links in copy (ui/TextLink) leave their section blank: name it after the
  // section they sit in (heroes have no id, so their title's id).
  if (params.section === "") {
    const section = el.closest("section");
    params.section = section?.id || section?.getAttribute("aria-labelledby") || "";
  }
  track(name, params);
}

// --- Components -------------------------------------------------------------

/** Mounted once in the root layout. Renders nothing when no GA ID is set. */
export function Analytics() {
  if (!GA_ENABLED) return null;
  return <ConsentManager />;
}

function ConsentManager() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Counts taps on "Cookie settings" since the last choice (0 = closed).
  const [reopened, setReopened] = useState(0);
  const acceptRef = useRef<HTMLButtonElement>(null);
  // The "Cookie settings" button, so focus can go back there afterwards.
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.addEventListener("click", onDocumentClick);
    const reopen = () => {
      if (document.activeElement instanceof HTMLElement) openerRef.current = document.activeElement;
      setReopened((n) => n + 1);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
    };
  }, []);

  useEffect(() => {
    if (consent === "granted") enableGa();
    // Also clears cookies left from an earlier visit when the visitor said yes.
    else if (consent === "denied") disableGa();
  }, [consent]);

  // Reopened from the footer: move focus into the banner so keyboard and
  // screen-reader users land on it. (A first visit does not steal focus.)
  useEffect(() => {
    if (reopened > 0) acceptRef.current?.focus();
  }, [reopened]);

  const choose = (value: Consent) => {
    saveConsent(value);
    setReopened(0);
    openerRef.current?.focus();
    openerRef.current = null;
  };

  const showBanner = consent === "unset" || (reopened > 0 && consent !== "unknown");

  // While the banner is open, keep the end of the page clear of it: the page
  // can scroll the footer above it, and a link that gets keyboard focus is
  // brought into view above it, not under it (WCAG 2.4.11).
  const bannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const banner = bannerRef.current;
    if (!showBanner || !banner) return;
    const root = document.documentElement;
    const update = () => {
      const space = `${banner.offsetHeight + parseFloat(getComputedStyle(banner).bottom) + 8}px`;
      root.style.scrollPaddingBottom = space;
      document.body.style.paddingBottom = space;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(banner);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      root.style.scrollPaddingBottom = "";
      document.body.style.paddingBottom = "";
    };
  }, [showBanner]);

  return (
    <>
      {consent === "granted" ? (
        <Script
          id="gtag-js"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
          strategy="afterInteractive"
        />
      ) : null}

      {showBanner ? (
        <div
          ref={bannerRef}
          role="region"
          aria-label="Cookie choice"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-card bg-card p-4 text-body shadow-raised ring-1 ring-line sm:bottom-5 sm:p-5"
        >
          <p className="text-base">
            We&apos;d like to use Google Analytics cookies to understand how people use this
            site.{" "}
            <Link prefetch={false} href="/privacy-policy/" className="font-label text-link underline">
              Privacy policy
            </Link>
          </p>
          {/* Brand buttons: blue outline "No thanks", green "Accept". */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={() => choose("denied")}
              className={`cursor-pointer ${buttonClasses("secondary")}`}
            >
              No thanks
            </button>
            <button
              ref={acceptRef}
              type="button"
              onClick={() => choose("granted")}
              className={`cursor-pointer ${buttonClasses("primary")}`}
            >
              Accept
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
