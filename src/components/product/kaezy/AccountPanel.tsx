"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { snackbar } from "@/components/ui/Snackbar";
import { BarChart3, Check, CreditCard, Loader2, Sprout, UserRound } from "lucide-react";
import { formatUgPhone, ugNationalNumber } from "./format";
import { fill, type Profile, type TryIt } from "./personalise";
import { isFresh, signOut, type Account, type Arrival, type Session } from "./partner";
import { LOW_FROM, UsageRing } from "./UsageGauge";

type Copy = TryIt["signIn"];

/** The API's stages, in the order a user goes through them. */
const STAGES = ["awareness", "onboarded", "transacted", "repeating"] as const;

/** "2026-10-31T09:00:00+00:00" -> "31 Oct 2026" */
function day(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** "2026-10" -> "October 2026" */
function monthName(value: string): string {
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/**
 * "Your Ka-Ezy account": a card under the Ka-Ezy window, only for a signed-in
 * (verified) visitor: who they are on the brand's gradient, then their stage
 * as a path they grow along, this month's use, and their plan in the same ring
 * as the window's header, from the Partner API
 * (5.3). Not signed in, nothing: signing in is SignInPopup's. The snackbar
 * says what is going on either way.
 */
export function AccountPanel({
  copy,
  session,
  account,
  arrival,
  profile,
  hireHref,
  className = "",
}: {
  copy: Copy;
  session: Session | null;
  account: Account | null;
  arrival: Arrival | null;
  profile: Profile;
  /** "Pay for Ka-Ezy here" on this page (the hire card), where the number is already filled in. */
  hireHref: string;
  className?: string;
}) {
  const a = copy.account;
  const t = copy.toasts;
  // The snackbar says what is going on, at each change of state.
  const busySnack = useRef<number | null>(null);
  const linking = !!arrival?.linking;
  const linkFailure = arrival?.failure ?? null;
  const signedIn = !!session;
  const loaded = !!account;
  const wasSignedIn = useRef<boolean | null>(null);
  const wasLoaded = useRef(false);
  const who = session ? session.name || account?.name || session.phone : "";
  const orgName = session ? session.organisation.name || session.organisation.orgCode : "";

  useEffect(() => {
    if (linking) busySnack.current = snackbar.show(t.signingIn, "busy");
    else if (busySnack.current !== null) {
      snackbar.dismiss(busySnack.current);
      busySnack.current = null;
    }
  }, [linking, t.signingIn]);

  useEffect(() => {
    if (!linkFailure) return;
    const text =
      linkFailure.code === "sign_in_link_used"
        ? copy.linkUsed
        : linkFailure.code === "sign_in_link_expired"
          ? copy.linkExpired
          : copy.linkInvalid;
    snackbar.show(text, "error");
  }, [linkFailure, copy.linkUsed, copy.linkExpired, copy.linkInvalid]);

  useEffect(() => {
    // First render: just remember; a stored session is not news.
    if (wasSignedIn.current === null) {
      wasSignedIn.current = signedIn;
      return;
    }
    if (signedIn === wasSignedIn.current) return;
    wasSignedIn.current = signedIn;
    // A session restored from storage after hydration is not news.
    if (signedIn && isFresh(session)) snackbar.show(fill(t.signedIn, profile, { who, org: orgName }), "success");
    else if (!signedIn) {
      wasLoaded.current = false;
      snackbar.show(t.signedOut, "info");
    }
    // who/orgName/session are read when the sign-in happens, not watched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, t.signedIn, t.signedOut]);

  useEffect(() => {
    if (!loaded || wasLoaded.current || !signedIn) return;
    wasLoaded.current = true;
    // Only after a fresh sign-in on this page: a reload's details are not news.
    if (isFresh(session)) snackbar.show(t.detailsReady, "info");
    // session is read at that moment, not watched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, signedIn, t.detailsReady]);

  if (!session) return null;

  const sub = account?.subscription;
  const used = sub && sub.type !== "none" ? sub.usagePercentage : null;
  const low = !!sub && (sub.status === "exhausted" || (used ?? 0) >= LOW_FROM);
  const planName = sub ? (a.plans[sub.type as keyof typeof a.plans] ?? sub.type) : "";
  const national = ugNationalNumber(session.phone);
  const place = account?.profile.district || account?.profile.region || "";
  const stage = STAGES.indexOf(account?.stage as (typeof STAGES)[number]);
  const asked = account?.usage.requests ?? 0;

  return (
    <section
      aria-labelledby="kaezy-account-title"
      className={`overflow-hidden rounded-card border border-line bg-card shadow-card ${className}`}
    >
      {/* Their card: who they are, on the brand's gradient. */}
      <div className="gradient-brand relative isolate flex flex-wrap items-center gap-x-4 gap-y-3 overflow-hidden p-5 text-on-inverse">
        <span aria-hidden="true" className="absolute -top-20 -right-10 -z-10 size-64 rounded-full border border-on-inverse/20" />
        <span aria-hidden="true" className="absolute -top-32 -right-24 -z-10 size-96 rounded-full border border-on-inverse/10" />
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-card text-2xl font-heading text-heading"
        >
          {/[a-z]/i.test(who.charAt(0)) ? who.charAt(0).toUpperCase() : <UserRound className="size-7" />}
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <h3 id="kaezy-account-title" className="text-xl font-heading text-on-inverse">
            {a.title}
          </h3>
          <p className="text-sm">
            {fill(copy.signedIn, profile, { who, org: orgName })}
            {session.organisation.sandbox ? (
              <span className="ml-2 inline-flex rounded-pill bg-card px-2 py-0.5 text-xs font-label text-accent">
                {copy.sandboxBadge}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-on-inverse/85">
            {[national ? formatUgPhone(national) : session.phone, place, session.organisation.orgCode].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          data-track="kaezy_sign_out"
          className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-button border-2 border-on-inverse bg-inverse/25 px-4 text-sm font-label transition-colors hover:bg-inverse/50"
        >
          {copy.signOut}
        </button>
      </div>

      {account ? (
        <dl className="grid divide-line max-md:divide-y md:grid-cols-3 md:divide-x">
          <Zone icon={<Sprout className="size-4" />} label={a.stageLabel}>
            {stage < 0 ? (
              <span className="text-base font-heading text-title">{account.stage}</span>
            ) : (
              // The way a user grows with their organisation; the stage lit is theirs.
              <ol className="mt-1">
                {STAGES.map((key, i) => (
                  <li key={key} aria-current={i === stage ? "step" : undefined} className="relative flex items-center gap-2.5 pb-2.5 last:pb-0">
                    {i < STAGES.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className={`absolute top-6 bottom-0 left-[0.6875rem] w-0.5 ${i < stage ? "bg-accent-bright" : "bg-line"}`}
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className={`relative flex size-6 shrink-0 items-center justify-center rounded-full ${
                        i < stage
                          ? "bg-accent-bright text-on-accent"
                          : i === stage
                            ? "bg-accent-bright text-on-accent ring-4 ring-accent-soft"
                            : "border-2 border-line bg-card"
                      }`}
                    >
                      {i < stage ? <Check className="size-3.5" /> : i === stage ? <Sprout className="size-3.5" /> : null}
                    </span>
                    <span className={i === stage ? "text-base font-heading text-title" : i < stage ? "text-sm text-body" : "text-sm text-muted"}>
                      {a.stages[key]}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Zone>

          <Zone icon={<BarChart3 className="size-4" />} label={`${a.monthLabel} · ${monthName(account.usage.month)}`}>
            <span className="flex items-baseline gap-2">
              <span className="text-4xl font-heading text-title tabular-nums">{asked}</span>
              <span className="text-sm text-body">{asked === 1 ? a.request : a.requests}</span>
            </span>
            <Meter label={a.farmExpert} value={account.usage.byFeature.farm_expert ?? 0} total={asked} />
            <Meter label={a.farmPlan} value={account.usage.byFeature.farm_plan ?? 0} total={asked} />
            <span className="mt-2.5 flex items-center gap-1.5 text-sm text-body">
              <span
                aria-hidden="true"
                className={`flex size-4 items-center justify-center rounded-full ${account.usage.hasRecords ? "bg-accent-bright text-on-accent" : "border-2 border-line"}`}
              >
                {account.usage.hasRecords ? <Check className="size-3" /> : null}
              </span>
              {a.records}: {account.usage.hasRecords ? a.yes : a.no}
            </span>
          </Zone>

          <Zone icon={<CreditCard className="size-4" />} label={a.planLabel}>
            <span className="flex items-center gap-4">
              {used !== null ? (
                <UsageRing
                  percent={Math.min(100, Math.max(0, used))}
                  track="stroke-subtle"
                  fill={low ? "stroke-danger" : "stroke-accent-bright"}
                  className="size-24"
                >
                  <span className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
                    <span className={`text-xl font-heading tabular-nums ${low ? "text-danger" : "text-title"}`}>{Math.round(used)}%</span>
                    <span className="text-xs text-muted">{a.used}</span>
                  </span>
                </UsageRing>
              ) : null}
              <span className="min-w-0">
                <span className="block text-base font-heading text-title">{planName}</span>
                {sub && sub.type !== "none" ? (
                  <span className={`mt-0.5 inline-flex rounded-pill px-2 py-0.5 text-xs font-label ${low ? "bg-subtle text-danger" : "bg-accent-soft text-accent"}`}>
                    {a.status[sub.status as keyof typeof a.status] ?? sub.status}
                  </span>
                ) : null}
                {sub?.expiresAt ? (
                  <span className="mt-1 block text-sm text-muted">
                    {a.ends} {day(sub.expiresAt)}
                  </span>
                ) : null}
              </span>
            </span>
            {/* Down to "Pay for Ka-Ezy here" on this page, with this number filled in. */}
            <a
              href={hireHref}
              data-track="kaezy_account_pay"
              className={`mt-3 w-full cursor-pointer ${buttonClasses(low || used === null ? "primary" : "secondary")}`}
            >
              {a.pay}
            </a>
          </Zone>
        </dl>
      ) : (
        <div role="status" aria-live="polite" className="p-5">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 aria-hidden="true" className="size-4 shrink-0 text-secondary motion-safe:animate-spin" />
            {a.loading}
          </p>
          {/* The three zones' shapes, so the card does not jump when they fill. */}
          <div aria-hidden="true" className="mt-3 grid gap-5 md:grid-cols-3">
            {[a.stageLabel, a.monthLabel, a.planLabel].map((label) => (
              <div key={label}>
                <p className="text-xs text-label-style text-label">{label}</p>
                <div className="mt-3 h-8 w-2/3 rounded-pill bg-subtle motion-safe:animate-pulse" />
                <div className="mt-3 h-3 w-full rounded-pill bg-subtle motion-safe:animate-pulse" />
                <div className="mt-2 h-3 w-1/2 rounded-pill bg-subtle motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Zone({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="p-5">
      <dt className="flex items-center gap-1.5 text-xs text-label-style text-label">
        <span aria-hidden="true" className="text-secondary">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-3 flex flex-col">{children}</dd>
    </div>
  );
}

/** One feature's share of the month: its name and count over a thin bar. */
function Meter({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <span className="mt-2.5 block text-sm text-body">
      <span className="flex justify-between gap-2">
        {label}
        <span className="font-label text-title tabular-nums">{value}</span>
      </span>
      <span aria-hidden="true" className="mt-1 block h-1.5 overflow-hidden rounded-pill bg-subtle">
        <span
          className="block h-full rounded-pill bg-secondary transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${total ? Math.min(100, (value / total) * 100) : 0}%` }}
        />
      </span>
    </span>
  );
}
