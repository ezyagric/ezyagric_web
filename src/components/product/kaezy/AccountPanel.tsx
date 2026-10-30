"use client";

import { useEffect, useRef } from "react";
import { snackbar } from "@/components/ui/Snackbar";
import { BarChart3, CreditCard, Loader2, Sprout, UserRound } from "lucide-react";
import { fill, type Profile, type TryIt } from "./personalise";
import { isFresh, signOut, type Account, type Arrival, type Session } from "./partner";
import { SignInCard } from "./SignInCard";
import { SMALL_SECONDARY } from "./Thread";

type Copy = TryIt["signIn"];

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
 * "Your Ka-Ezy account": a band under the Ka-Ezy window, only for a
 * signed-in (verified) visitor: who they are, their stage with the
 * organisation, this month's use and their Ka-Ezy plan, from the Partner API
 * (5.3). Not signed in, the band shows the sign-in form only when asked for
 * (the window's "Sign in" button) or when a link brought the organisation
 * and phone along; otherwise nothing.
 */
export function AccountPanel({
  copy,
  session,
  account,
  arrival,
  profile,
  wanted,
  hireHref,
  className = "",
}: {
  copy: Copy;
  session: Session | null;
  account: Account | null;
  arrival: Arrival | null;
  profile: Profile;
  /** The visitor pressed "Sign in" in the Ka-Ezy window. */
  wanted: boolean;
  /** "Pay for Ka-Ezy here" on this page (the hire card), where the number is already filled in. */
  hireHref: string;
  className?: string;
}) {
  const a = copy.account;
  const t = copy.toasts;
  const panelRef = useRef<HTMLDivElement>(null);
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
  const fromLink = !!arrival && (!!arrival.org || !!arrival.phone || arrival.linking || !!arrival.failure);
  const showForm = !session && (wanted || fromLink);

  // Asked for from the window above: bring the form into view.
  useEffect(() => {
    if (!wanted || session) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panelRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [wanted, session]);

  if (!session && !showForm) return null;

  if (!session && arrival?.linking) {
    return (
      <div
        ref={panelRef}
        role="status"
        aria-live="polite"
        className={`flex items-center gap-4 rounded-card border border-line bg-card p-5 shadow-card ${className}`}
      >
        <Loader2 aria-hidden="true" className="size-8 shrink-0 text-secondary motion-safe:animate-spin" />
        <div className="min-w-0">
          <p className="text-base font-heading text-title">{copy.linkSigningIn}</p>
          <p className="mt-0.5 text-sm text-muted">
            {copy.linkSigningInHint}
            {arrival.orgName || arrival.org || arrival.phoneMasked || arrival.phone ? (
              <>
                {" "}
                <span className="text-title">
                  {[arrival.orgName || arrival.org, arrival.phoneMasked || arrival.phone].filter(Boolean).join(" · ")}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div ref={panelRef} className={`rounded-card border border-line bg-card p-5 shadow-card ${className}`}>
        <SignInCard copy={copy} session={session} profile={profile} className="mx-auto max-w-xl" />
      </div>
    );
  }

  const org = orgName;
  const sub = account?.subscription;
  const used = sub?.usagePercentage ?? null;
  const planName = sub ? (a.plans[sub.type as keyof typeof a.plans] ?? sub.type) : "";

  return (
    <section
      ref={panelRef}
      aria-labelledby="kaezy-account-title"
      className={`rounded-card border border-line bg-card p-5 shadow-card ${className}`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-secondary"
        >
          <UserRound className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="kaezy-account-title" className="text-lg font-heading text-title">
            {a.title}
          </h3>
          <p className="text-sm text-body">
            {fill(copy.signedIn, profile, { who, org })}
            {session.organisation.sandbox ? (
              <span className="ml-2 inline-flex rounded-pill bg-accent-soft px-2 py-0.5 text-xs font-label text-accent">
                {copy.sandboxBadge}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {session.organisation.orgCode} · {session.phone}
            {account?.profile.district || account?.profile.region ? (
              <> · {account.profile.district || account.profile.region}</>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          data-track="kaezy_sign_out"
          className={SMALL_SECONDARY}
        >
          {copy.signOut}
        </button>
      </div>

      {account ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Tile icon={<Sprout className="size-4" />} label={a.stageLabel}>
            <span className="text-base font-heading text-title">
              {a.stages[account.stage as keyof typeof a.stages] ?? account.stage}
            </span>
          </Tile>

          <Tile icon={<BarChart3 className="size-4" />} label={`${a.monthLabel} · ${monthName(account.usage.month)}`}>
            <span className="text-base font-heading text-title">
              {account.usage.requests} {account.usage.requests === 1 ? a.request : a.requests}
            </span>
            <span className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted">
              <span className="rounded-pill bg-subtle px-2 py-0.5">
                {a.farmExpert} {account.usage.byFeature.farm_expert ?? 0}
              </span>
              <span className="rounded-pill bg-subtle px-2 py-0.5">
                {a.farmPlan} {account.usage.byFeature.farm_plan ?? 0}
              </span>
              <span className="rounded-pill bg-subtle px-2 py-0.5">
                {a.records} {account.usage.hasRecords ? a.yes : a.no}
              </span>
            </span>
          </Tile>

          <Tile icon={<CreditCard className="size-4" />} label={a.planLabel}>
            <span className="text-base font-heading text-title">
              {planName}
              {sub && sub.type !== "none" ? (
                <span className={`ml-2 text-xs font-label ${sub.status === "exhausted" ? "text-danger" : "text-accent"}`}>
                  {a.status[sub.status as keyof typeof a.status] ?? sub.status}
                </span>
              ) : null}
            </span>
            {used !== null && sub?.type !== "none" ? (
              <span className="mt-1.5 block">
                <span className="block h-2 w-full overflow-hidden rounded-pill bg-subtle">
                  <span
                    className={`block h-full rounded-pill ${used >= 98 ? "bg-danger" : "bg-secondary"}`}
                    style={{ width: `${Math.min(100, Math.max(0, used))}%` }}
                  />
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {Math.round(used)}% {a.used}
                  {sub?.expiresAt ? ` · ${a.ends} ${day(sub.expiresAt)}` : ""}
                </span>
              </span>
            ) : null}
            {/* Down to "Pay for Ka-Ezy here" on this page, with this number filled in. */}
            <a
              href={hireHref}
              data-track="kaezy_account_pay"
              className="mt-2 inline-block text-sm font-label text-link underline underline-offset-4"
            >
              {a.pay}
            </a>
          </Tile>
        </dl>
      ) : (
        <div role="status" aria-live="polite" className="mt-4">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 aria-hidden="true" className="size-4 shrink-0 text-secondary motion-safe:animate-spin" />
            {a.loading}
          </p>
          {/* The three tiles' shapes, so the band does not jump when they fill. */}
          <div aria-hidden="true" className="mt-3 grid gap-3 sm:grid-cols-3">
            {[a.stageLabel, a.monthLabel, a.planLabel].map((label) => (
              <div key={label} className="rounded-control border border-line bg-canvas p-3">
                <p className="text-xs text-label-style text-label">{label}</p>
                <div className="mt-2 h-5 w-2/3 rounded-pill bg-subtle motion-safe:animate-pulse" />
                <div className="mt-2 h-3 w-1/2 rounded-pill bg-subtle motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Tile({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-control border border-line bg-canvas p-3">
      <dt className="flex items-center gap-1.5 text-xs text-label-style text-label">
        <span aria-hidden="true" className="text-secondary">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-1 flex flex-col">{children}</dd>
    </div>
  );
}
