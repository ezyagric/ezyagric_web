"use client";

import { useEffect, useState } from "react";

/** How often an open page asks again; the endpoint and nginx cache for about as long. */
const REFRESH_MS = 5 * 60 * 1000;
/** No answer within this long: keep what is shown. */
const TIMEOUT_MS = 8000;
/** A count above this is a broken answer, never shown. */
const MAX_COUNT = 100_000_000;

/**
 * An impact number kept live (docs/backend-tickets.md BT-10): the number
 * typed in content/site.yaml first (`fallback`: it is server-rendered, so it
 * shows without JavaScript and while loading), then `base` plus the count the
 * endpoint returns ({"count": 52345}), on load and every five minutes while
 * the page is open and in view. Anything else (no answer, an error, a count
 * that is not a whole number from 1 to 100 million) keeps what is shown.
 * Changes are not announced to screen readers: the number is not news.
 */
export function LiveCount({
  endpoint,
  base,
  fallback,
  suffix,
}: {
  endpoint: string;
  base: number;
  fallback: number;
  suffix: string;
}) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    let stopped = false;
    let lastAsked = 0;

    async function load() {
      if (document.visibilityState !== "visible") return;
      lastAsked = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(endpoint, {
          credentials: "omit",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data: unknown = await res.json();
        const count = typeof data === "object" && data !== null ? (data as { count?: unknown }).count : undefined;
        if (typeof count === "number" && Number.isInteger(count) && count >= 1 && count <= MAX_COUNT && !stopped) {
          setValue(base + count);
        }
      } catch {
        // Offline, timed out or not JSON: keep what is shown.
      } finally {
        clearTimeout(timer);
      }
    }

    void load();
    const interval = setInterval(load, REFRESH_MS);
    // Back in view after a while (another tab, a locked phone): ask again.
    function onVisible() {
      if (document.visibilityState === "visible" && Date.now() - lastAsked >= REFRESH_MS) void load();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [endpoint, base]);

  return (
    <>
      {value.toLocaleString("en-US")}
      {suffix}
    </>
  );
}
