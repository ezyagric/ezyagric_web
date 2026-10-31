"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Loader2, ShieldCheck, XCircle } from "lucide-react";
import type { Product } from "@/lib/content";
import { KeepHyphensTogether } from "@/components/ui/KeepHyphens";
import { PARTNER_ENABLED, PayRefused, partnerPayService, useAccount, useSession } from "./partner";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import {
  NETWORKS,
  formatUgPhone,
  formatUgx,
  networkFor,
  ugNationalNumber,
  type Network,
} from "./format";
import { demoService, type DemoOutcome, type PayResult, type PayStatus } from "./service";
import { FieldError, PhoneField } from "./PhoneField";
import { KaEzyAvatar } from "./Thread";

type Hire = NonNullable<Product["tryIt"]>["hire"];

export type HirePlan = {
  name: string;
  months: number;
  monthlyUgx: number;
  badge?: string;
  highlight: boolean;
};

type Step = "plan" | "pay" | "progress" | "done" | "failed" | "app";

/**
 * How paying works on this build:
 * - "demo": preview builds walk through the whole Mobile Money flow,
 *   simulated (no request leaves the browser, no money moves).
 * - "app": the live site, until a secure web payment API exists, takes the
 *   plan choice and then sends the visitor to the app to pay.
 */
export type PayMode = "demo" | "app";

/** The app's plan subtitles, by plan length. */
function planLine(months: number): string {
  if (months <= 1) return "Start quickly with full Ka-Ezy access";
  if (months <= 3) return "Smart value for a full farming season";
  if (months <= 6) return "Longer support with better savings";
  return "Our best value for year-round farm support";
}

const monthsText = (months: number) => `${months} month${months === 1 ? "" : "s"}`;

/** "6-month plan" */
const planLabel = (months: number) => `${months}-month plan`;

// Plan cards side by side from md: three (the app's plans) in a row, two or
// four as twos. Full class strings so Tailwind can find them.
const PLAN_COLUMNS: Record<number, string> = {
  1: "",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2",
};

// The plan and network choices: whole-card radios, with a blue border and
// tint once chosen and the focus ring on the card (the radio draws none).
const RADIO_CARD =
  "cursor-pointer rounded-card border-2 border-line transition-colors hover:border-secondary has-[:checked]:border-secondary has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus";

/**
 * "Hire Ka-Ezy": choose a plan, pay with MTN MoMo or Airtel Money, approve
 * the prompt on the phone, done. Redrawn from the app's plan list, Mobile
 * Money sheet and progress messages, in the website's theme.
 *
 * One card in two parts: Hire Ka-Ezy on navy (the step, as words and a bar,
 * and the demo note on preview builds), then the current step. Below lg the
 * navy part is a short header, so the plans start near the card's top (the
 * "Pay for Ka-Ezy" links land here), and why farmers hire Ka-Ezy follows the
 * plans. From lg they sit side by side: the navy column is as wide as the
 * demo's "Your farm" column above (20rem, less this card's 1px border), so
 * their edges line up, and the reasons move to its foot, level with the
 * step's buttons.
 */
export function HireKaEzy({
  id,
  hire,
  avatar,
  plans,
  payMode,
  storeBadges,
}: {
  id: string;
  hire: Hire;
  /** Ka-Ezy's face, on the pay header (as on the Ka-Ezy window's). */
  avatar: string;
  plans: HirePlan[];
  payMode: PayMode;
  /** Server-rendered store badges (they read site settings). */
  storeBadges: ReactNode;
}) {
  // Signed in through the Partner API, the payment is real (partner.ts);
  // otherwise the simulation (preview builds) or the hand-off to the app.
  const session = useSession();
  const account = useAccount();
  const live = PARTNER_ENABLED && !!session;
  const mode: PayMode | "live" = live ? "live" : payMode;
  const demo = useMemo(() => demoService({ answers: [], otherQuestion: "" }), []);
  const service = useMemo(() => (live && session ? partnerPayService(session) : demo), [live, session, demo]);
  const [payMessage, setPayMessage] = useState("");
  const firstPick = Math.max(0, plans.findIndex((p) => p.highlight));
  const [step, setStep] = useState<Step>("plan");
  const [planIndex, setPlanIndex] = useState(firstPick);
  const [network, setNetwork] = useState<Network | null>(null);
  const [networkPicked, setNetworkPicked] = useState(false);
  // Signed in to "Try Ka-Ezy" (partner.ts): their phone is the Mobile Money
  // number, since the prompt goes to the signed-in phone.
  const signedInNational = PARTNER_ENABLED && session ? ugNationalNumber(session.phone) : null;
  const [typedPaying, setTypedPaying] = useState<string | null>(null);
  // Signed in, the number is the one the sign-in registered with EzyAgric: it
  // cannot be changed here (sign out and in with another to use that one).
  const locked = !!signedInNational;
  const paying = locked ? `${signedInNational.slice(0, 3)} ${signedInNational.slice(3, 6)} ${signedInNational.slice(6)}` : typedPaying ?? "";

  // "I use this number in the EzyAgric App": the plan goes to the account
  // with the paying number, so paying is off until the visitor confirms it.
  const [sameNumber, setSameNumber] = useState(true);
  // Registered with EzyAgric, as the API saw it (5.3): a plan needs an account to land on.
  const registration: "linked" | "pending" | "sandbox" | "unknown" | null = !PARTNER_ENABLED || !session ? null : account ? account.ezyagricAccount : "unknown";
  const canPay = sameNumber && registration !== "pending" && registration !== "unknown";
  const [errors, setErrors] = useState<{ paying?: string; network?: string }>({});
  const [status, setStatus] = useState<PayStatus>("sending");
  const [result, setResult] = useState<PayResult | null>(null);
  const [outcome, setOutcome] = useState<DemoOutcome>("approved");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef<Step>("plan");
  const abortRef = useRef<AbortController | null>(null);

  const plan = plans[planIndex];
  const total = plan.months * plan.monthlyUgx;
  const payingNational = ugNationalNumber(paying);
  const accountNational = payingNational;
  // The network: picked, or read from the number's prefix (a prefilled one included).
  const chosenNetwork = network ?? (payingNational ? networkFor(payingNational) : null);
  const totalSteps = mode === "app" ? 2 : 3;

  useEffect(() => () => abortRef.current?.abort(), []);

  // Move focus to the new step's heading (not on first render).
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  function onPayingChange(value: string) {
    setTypedPaying(value);
    const national = ugNationalNumber(value);
    if (!national) return;
    // Clear the error as soon as the number is fixed, and pick the network
    // from the prefix unless the visitor already chose one.
    const detected = networkPicked ? null : networkFor(national);
    if (detected) setNetwork(detected);
    setErrors((e) => ({ ...e, paying: undefined, ...(detected ? { network: undefined } : {}) }));
  }

  async function onPay(event: FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!payingNational) next.paying = "Enter a Ugandan mobile number, for example 0772 123 456.";
    if (!chosenNetwork) next.network = "Choose MTN MoMo or Airtel Money.";
    if (!canPay) return;
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = next.paying ? "kaezy-paying" : "kaezy-network-mtn";
      document.getElementById(first)?.focus();
      return;
    }

    setStatus("sending");
    setPayMessage("");
    setStep("progress");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const final = await service.pay(
        {
          planName: plan.name,
          months: plan.months,
          amountUgx: total,
          network: chosenNetwork!,
          payingNumber: payingNational!,
          accountNumber: accountNational!,
        },
        { onStatus: setStatus, signal: controller.signal, demoOutcome: outcome, onMessage: setPayMessage },
      );
      setResult(final);
      setStep(final === "fulfilled" ? "done" : "failed");
    } catch (error) {
      // Refused before any prompt went out: say why. Anything else is an
      // abort (the visitor left the page).
      if (error instanceof PayRefused && !controller.signal.aborted) {
        setPayMessage(error.message);
        setResult("failed");
        setStep("failed");
      }
    }
  }

  function restart(to: Step) {
    abortRef.current?.abort();
    setResult(null);
    setStep(to);
  }

  const stepNumber = { plan: 1, pay: 2, app: 2, progress: 3, done: 3, failed: 3 }[step];

  return (
    <div
      id={id}
      tabIndex={-1}
      className="grid grid-cols-1 overflow-hidden rounded-card border border-line bg-card shadow-card lg:grid-cols-[minmax(0,calc(20rem_-_1px))_minmax(0,1fr)]"
    >
      {/* Hire Ka-Ezy on navy, with Ka-Ezy's icon as a faint watermark. */}
      <div className="relative isolate flex flex-col overflow-hidden bg-inverse p-5 text-on-inverse sm:p-6">
        <Icon name="bot" className="absolute -right-8 -bottom-10 -z-10 size-44 -rotate-12 text-on-inverse/10" />
        <div className="flex items-center gap-3">
          <IconCircle name="wallet" color="accent" />
          <div className="min-w-0">
            <h3 className="text-2xl font-heading tracking-heading text-on-inverse">{hire.title}</h3>
            <p className="text-sm text-label-style text-on-inverse">
              Step {stepNumber} of {totalSteps}
            </p>
          </div>
        </div>
        {/* The same progress as a bar, one segment per step (the line above says it in words). */}
        <span aria-hidden="true" className="mt-4 flex max-w-sm gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-pill ${i < stepNumber ? "bg-accent-bright" : "bg-on-inverse/20"}`}
            />
          ))}
        </span>
        {mode === "demo" ? (
          <p className="mt-4 rounded-control border border-dashed border-review bg-review-soft px-3 py-2 text-sm text-review">
            Demo: no request leaves this page and no money is taken.
          </p>
        ) : mode === "live" && session?.organisation.sandbox ? (
          <p className="mt-4 rounded-control border border-dashed border-review bg-review-soft px-3 py-2 text-sm text-review">
            Test organisation: no prompt is sent to a phone and no money is taken.
          </p>
        ) : null}
        {/* Why farmers hire Ka-Ezy, from lg: beside every step, at the column's
            foot. Below lg the plan step shows them under the plans instead. */}
        <Benefits items={hire.benefits} invert className="max-lg:hidden lg:mt-auto lg:pt-6" />
      </div>

      <div className="flex min-w-0 flex-col">
        {/* "2. Pay for Ka-Ezy here", branded as the Ka-Ezy window's header
            ("1. Try Ka-Ezy Demo here") above: Ka-Ezy's face on brand blue. It is
            the plan step's heading (focused when going back to it); the
            later steps add their own heading under it. */}
        <div className="flex items-center gap-3 bg-brand px-5 py-3 text-on-brand sm:px-6">
          <KaEzyAvatar src={avatar} size="lg" />
          <div className="min-w-0 flex-1">
            <h4
              ref={step === "plan" ? headingRef : undefined}
              tabIndex={-1}
              className="text-lg font-heading text-on-brand focus-visible:outline-focus-inverse"
            >
              <span className="tabular-nums">2.</span> {hire.payTitle}
            </h4>
            <p className="text-sm leading-snug text-on-brand/85">{hire.intro}</p>
          </div>
        </div>

        {/* The current step. Steps with buttons fill the column, so the buttons sit at its foot. */}
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          {step === "plan" ? (
            <form
              // method="dialog": before the scripts load, Continue does nothing
              // instead of reloading the page.
              method="dialog"
              className="flex flex-1 flex-col"
              onSubmit={(event) => {
                event.preventDefault();
                setStep(mode === "app" ? "app" : "pay");
              }}
            >
              <fieldset>
                <legend className="sr-only">Ka-Ezy plan</legend>
                <div className={`grid grid-cols-1 gap-3 ${PLAN_COLUMNS[plans.length] ?? "md:grid-cols-3"}`}>
                  {plans.map((p, i) => (
                    // A card per plan: name and saving, the app's subtitle, then
                    // the price. On phones they stack; from sm (one per row) the
                    // price moves to the right. From md (side by side) each card
                    // spans two rows of this grid (subgrid), so the prices share
                    // a row and line up whatever wraps above or beside them.
                    // A little less side padding from lg to xl, where the cards
                    // are narrowest beside the navy column.
                    <label
                      key={p.name}
                      className={`group relative flex flex-col gap-3 overflow-hidden p-4 sm:flex-row sm:items-center sm:justify-between md:row-span-2 md:grid md:grid-rows-subgrid md:items-start md:justify-normal lg:px-3.5 xl:px-4 ${RADIO_CARD}`}
                    >
                      {/* The plan the content highlights carries a thin signature
                          gradient strip along its top (its price card in
                          components/product/Pricing has a gradient header). */}
                      {p.highlight ? (
                        <span aria-hidden="true" className="gradient-brand-decor absolute inset-x-0 top-0 h-2" />
                      ) : null}
                      <span className="min-w-0">
                        {/* The saving goes under the name only if a card is too narrow for both. */}
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <input
                            type="radio"
                            name="kaezy-plan"
                            checked={i === planIndex}
                            onChange={() => setPlanIndex(i)}
                            className="size-5 shrink-0 accent-secondary focus-visible:outline-none"
                          />
                          <span className="font-heading text-title">{p.name}</span>
                          {p.badge ? (
                            <span className="ml-auto rounded-pill bg-accent px-2 py-0.5 text-xs font-label text-on-primary sm:ml-0 md:ml-auto">
                              {p.badge}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-sm text-muted">
                          <KeepHyphensTogether text={planLine(p.months)} />
                        </span>
                      </span>
                      <span className="block shrink-0 sm:text-right md:text-left">
                        {/* Darker green on the selected card's tint. One step smaller
                            from lg to xl, so "a month" stays on the price's line. */}
                        <span className="block text-2xl font-heading tracking-heading text-accent group-has-[:checked]:text-accent-hover lg:text-xl xl:text-2xl">
                          {formatUgx(p.monthlyUgx)}
                          <span className="text-sm font-label tracking-normal text-muted"> a month</span>
                        </span>
                        <span className="block text-sm text-muted">
                          <span className="font-label text-title">{formatUgx(p.months * p.monthlyUgx)}</span>{" "}
                          <span className="whitespace-nowrap">for {monthsText(p.months)}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Below lg (where the navy part is only a header), the reasons
                  follow the plans; one copy or the other is display:none. */}
              <Benefits items={hire.benefits} className="mt-5 lg:hidden" />

              <Actions className="justify-between">
                <p>
                  <span className="block text-sm text-muted">Pay today</span>
                  <span className="text-2xl font-heading tracking-heading text-accent">{formatUgx(total)}</span>
                </p>
                {/* Fills the row beside the total on phones (full width once it wraps). */}
                <button
                  type="submit"
                  data-track="kaezy_hire_continue"
                  data-track-plan={plan.name}
                  className={`${buttonClasses("primary")} grow cursor-pointer whitespace-nowrap sm:grow-0`}
                >
                  Continue
                </button>
              </Actions>
            </form>
          ) : null}

          {step === "pay" ? (
            <form method="dialog" className="flex flex-1 flex-col" onSubmit={onPay} noValidate>
              <h4 ref={headingRef} tabIndex={-1} className="text-lg font-heading text-title">
                Pay with Mobile Money
              </h4>
              <PlanSummary plan={plan} total={total} onChange={() => restart("plan")} />

              <fieldset className="mt-4" aria-describedby={errors.network ? "kaezy-network-error" : undefined}>
                <legend className="text-base font-label text-title">Mobile Money network</legend>
                {/* One per row on phones, where two side by side are too narrow
                    for the radio, the logo and the name. */}
                <div className="mt-2 grid gap-2 sm:grid-cols-2 sm:gap-3">
                  {(Object.keys(NETWORKS) as Network[]).map((key) => (
                    <label key={key} className={`flex min-h-12 items-center gap-3 px-3 py-1.5 ${RADIO_CARD}`}>
                      <input
                        id={`kaezy-network-${key}`}
                        type="radio"
                        name="kaezy-network"
                        checked={chosenNetwork === key}
                        onChange={() => {
                          setNetwork(key);
                          setNetworkPicked(true);
                          setErrors((e) => ({ ...e, network: undefined }));
                        }}
                        className="size-5 shrink-0 accent-secondary focus-visible:outline-none"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
                      <img
                        src={NETWORKS[key].logo}
                        alt=""
                        width={120}
                        height={120}
                        className="size-8 shrink-0 rounded-control"
                      />
                      <span className="min-w-0 text-base font-label text-title">{NETWORKS[key].name}</span>
                    </label>
                  ))}
                </div>
                {errors.network ? <FieldError id="kaezy-network-error">{errors.network}</FieldError> : null}
              </fieldset>

              <PhoneField
                id="kaezy-paying"
                label="Mobile Money number"
                hint={
                  locked
                    ? "From your sign-in: the number registered with EzyAgric, which pays and gets the plan. To use another number, sign out and sign in with it."
                    : "The number that pays. You approve the payment on this phone, and the plan goes to this number's EzyAgric account."
                }
                value={paying}
                onChange={onPayingChange}
                error={errors.paying}
                readOnly={locked}
              />

              {/* The padding makes the whole line a 44px+ tap target; the help
                  below follows it closely. */}
              <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-3 py-2.5 text-base text-body">
                <input
                  type="checkbox"
                  checked={sameNumber}
                  onChange={(event) => setSameNumber(event.target.checked)}
                  aria-describedby="kaezy-same-number-help"
                  className="mt-1 size-5 shrink-0 accent-secondary"
                />
                I use this number in the EzyAgric App
              </label>
              <p id="kaezy-same-number-help" className="pl-8 text-sm text-muted">
                {sameNumber ? hire.accountHelp : hire.accountRequired}
              </p>
              {registration === "pending" ? (
                <p role="alert" className="mt-3 text-sm font-label text-danger">
                  {hire.notRegistered}
                </p>
              ) : registration === "unknown" ? (
                <p role="status" className="mt-3 text-sm text-muted">
                  {hire.checkingAccount}
                </p>
              ) : null}

              <p className="mt-4 flex items-start gap-2 text-sm text-muted">
                <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-accent-bright" />
                <span>{hire.policy}</span>
              </p>

              {mode === "live" && !session?.organisation.sandbox ? (
                <p className="mt-4 text-sm text-body">{hire.livePrompt}</p>
              ) : null}

              {mode === "demo" || session?.organisation.sandbox ? (
              <fieldset className="mt-4 rounded-control border border-dashed border-review bg-review-soft px-3 py-1">
                <legend className="px-1 text-sm font-label text-review">
                  {mode === "demo" ? "Demo only: what happens next?" : "Test organisation: what happens next?"}
                </legend>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {(
                    [
                      ["approved", "Approved"],
                      ["declined", "Declined"],
                      ["timed_out", "Timed out"],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-body">
                      <input
                        type="radio"
                        name="kaezy-demo-outcome"
                        checked={outcome === value}
                        onChange={() => setOutcome(value)}
                        className="size-4 accent-secondary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              ) : null}

              {/* nowrap: on the narrowest phones Pay takes its own full-width
                  line rather than breaking its amount over two. */}
              <Actions>
                <button
                  type="button"
                  onClick={() => restart("plan")}
                  className={`${buttonClasses("secondary")} cursor-pointer whitespace-nowrap`}
                >
                  <ChevronLeft aria-hidden="true" className="size-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!canPay}
                  data-track="kaezy_hire_pay"
                  data-track-plan={plan.name}
                  data-track-network={chosenNetwork ?? "none"}
                  className={`${buttonClasses("primary")} flex-1 cursor-pointer whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Pay {formatUgx(total)}
                </button>
              </Actions>
            </form>
          ) : null}

          {step === "progress" ? (
            <div>
              <h4 ref={headingRef} tabIndex={-1} className="text-lg font-heading text-title">
                Approve on your phone
              </h4>
              <ProgressList
                status={status}
                total={total}
                phone={payingNational ? formatUgPhone(payingNational) : ""}
                network={network ?? "mtn"}
              />
            </div>
          ) : null}

          {step === "done" ? (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-bright text-on-accent">
                  <Check aria-hidden="true" className="size-7" />
                </span>
                <h4 ref={headingRef} tabIndex={-1} className="text-2xl font-heading tracking-heading text-heading">
                  Ka-Ezy is hired!
                </h4>
              </div>
              <p className="mt-3 text-base text-body">
                Your {planLabel(plan.months)} is active on{" "}
                <span className="font-label text-title">
                  {accountNational ? formatUgPhone(accountNational) : ""}
                </span>
                . Open the EzyAgric App and sign in with this number to enjoy Hired Ka-Ezy.
              </p>
              <Actions>
                {storeBadges}
                <button
                  type="button"
                  onClick={() => restart("plan")}
                  className={`${buttonClasses("secondary")} cursor-pointer whitespace-nowrap sm:ml-auto`}
                >
                  Start again
                </button>
              </Actions>
            </div>
          ) : null}

          {step === "failed" ? (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <XCircle aria-hidden="true" className="size-12 shrink-0 text-danger" />
                <h4 ref={headingRef} tabIndex={-1} className="text-2xl font-heading tracking-heading text-heading">
                  Payment not completed
                </h4>
              </div>
              <p className="mt-3 text-base text-body">
                {result === "expired" ? "The prompt timed out before it was approved." : "Your payment did not go through."} If
                money left your account,{" "}
                <Link prefetch={false} href="/#contact-us" className="font-label text-link underline underline-offset-4">
                  contact us
                </Link>{" "}
                and we&apos;ll activate your plan or refund you.
              </p>
              {payMessage ? <p className="mt-2 text-sm text-muted">{payMessage}</p> : null}
              <Actions>
                <button
                  type="button"
                  onClick={() => restart("pay")}
                  className={`${buttonClasses("primary")} cursor-pointer whitespace-nowrap`}
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => restart("plan")}
                  className={`${buttonClasses("secondary")} cursor-pointer whitespace-nowrap`}
                >
                  Change plan
                </button>
              </Actions>
            </div>
          ) : null}

          {step === "app" ? (
            <div className="flex flex-1 flex-col">
              <h4 ref={headingRef} tabIndex={-1} className="text-lg font-heading text-title">
                Finish in the EzyAgric App
              </h4>
              <PlanSummary plan={plan} total={total} onChange={() => restart("plan")} />
              <p className="mt-4 text-base text-body">{hire.appHandoff}</p>
              <Actions>
                {storeBadges}
                <button
                  type="button"
                  onClick={() => restart("plan")}
                  className={`${buttonClasses("secondary")} cursor-pointer whitespace-nowrap sm:ml-auto`}
                >
                  <ChevronLeft aria-hidden="true" className="size-5" />
                  Back
                </button>
              </Actions>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * A step's buttons, on a divided line at the foot of the step (from lg,
 * level with the reasons at the foot of the navy column).
 */
function Actions({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className="mt-auto pt-5">
      <div className={`flex flex-wrap items-center gap-3 border-t border-line pt-5 ${className}`}>{children}</div>
    </div>
  );
}

/** Why farmers hire Ka-Ezy, ticked: white on the navy column, body text on the card. */
function Benefits({ items, invert = false, className }: { items: string[]; invert?: boolean; className: string }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((benefit) => (
        <li
          key={benefit}
          className={`flex items-start gap-2.5 text-base ${invert ? "text-on-inverse" : "text-body"}`}
        >
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-bright text-on-accent"
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span className="min-w-0">{benefit}</span>
        </li>
      ))}
    </ul>
  );
}

/** The chosen plan on one line ("6-month plan · UGX 28,500"; two on phones), with Change. */
function PlanSummary({ plan, total, onChange }: { plan: HirePlan; total: number; onChange: () => void }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-control bg-subtle py-1 pr-1 pl-4">
      {/* The real spaces keep the plan and the amount apart for screen readers,
          which skip the dot; with px-1 they space the dot as px-2 alone did. */}
      <p className="min-w-0 py-1.5">
        <span className="font-heading text-title">{planLabel(plan.months)}</span>{" "}
        <span aria-hidden="true" className="px-1 text-muted max-sm:hidden">
          ·
        </span>{" "}
        <span className="block font-heading text-accent sm:inline">{formatUgx(total)}</span>
      </p>
      <button
        type="button"
        onClick={onChange}
        className="min-h-11 shrink-0 cursor-pointer rounded-control px-3 font-heading text-link hover:underline"
      >
        Change<span className="sr-only"> plan</span>
      </button>
    </div>
  );
}


/** Each stage is current while the payment has this status; "fulfilled" means all done. */
const STAGES: { status: PayStatus; text: (total: string, phone: string) => string }[] = [
  { status: "sending", text: (_total, phone) => `Sending the payment request to ${phone}` },
  { status: "instructions_sent", text: (total) => `Approve the ${total} prompt on your phone and enter your PIN` },
  { status: "successful", text: () => "Payment received. Activating your plan" },
];

/** The app's progress messages, as a checklist. */
function ProgressList({
  status,
  total,
  phone,
  network,
}: {
  status: PayStatus;
  total: number;
  phone: string;
  network: Network;
}) {
  const amount = formatUgx(total);
  const current = STAGES.findIndex((stage) => stage.status === status);
  return (
    <>
      <ol className="mt-4 space-y-4">
        {STAGES.map((stage, i) => {
          const done = current === -1 || i < current;
          const active = i === current;
          return (
            <li key={i} className="flex items-start gap-3">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-accent-bright text-on-accent" : active ? "bg-brand-soft text-secondary" : "border-2 border-line"
                }`}
              >
                {done ? (
                  <Check aria-hidden="true" className="size-5" />
                ) : active ? (
                  <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />
                ) : null}
              </span>
              <span className={`pt-1 text-base ${active ? "font-label text-title" : done ? "text-body" : "text-muted"}`}>
                {stage.text(amount, phone)}
                {active ? "…" : null}
                {i === 1 && active ? (
                  <span className="mt-1 block text-sm font-normal text-muted">
                    No prompt after a minute? Dial {NETWORKS[network].ussd} for {NETWORKS[network].name}.
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
      <p role="status" className="sr-only">
        {current >= 0 ? STAGES[current].text(amount, phone) : "Plan active."}
      </p>
    </>
  );
}
