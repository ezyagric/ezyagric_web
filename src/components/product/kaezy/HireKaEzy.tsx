"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, CheckCircle2, ChevronLeft, Loader2, ShieldCheck, XCircle } from "lucide-react";
import type { Product } from "@/lib/content";
import { buttonClasses } from "@/components/ui/Button";
import {
  NETWORKS,
  formatUgPhone,
  formatUgx,
  networkFor,
  ugNationalNumber,
  type Network,
} from "./format";
import { demoService, type DemoOutcome, type PayResult, type PayStatus } from "./service";

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

/**
 * "Hire Ka-Ezy": choose a plan, pay with MTN MoMo or Airtel Money, approve
 * the prompt on the phone, done. Redrawn from the app's plan list, Mobile
 * Money sheet and progress messages, in the website's theme.
 */
export function HireKaEzy({
  id,
  hire,
  plans,
  payMode,
  storeBadges,
}: {
  id: string;
  hire: Hire;
  plans: HirePlan[];
  payMode: PayMode;
  /** Server-rendered store badges (they read site settings). */
  storeBadges: ReactNode;
}) {
  const service = useMemo(() => demoService({ answers: [], otherQuestion: "" }), []);
  const firstPick = Math.max(0, plans.findIndex((p) => p.highlight));
  const [step, setStep] = useState<Step>("plan");
  const [planIndex, setPlanIndex] = useState(firstPick);
  const [network, setNetwork] = useState<Network | null>(null);
  const [networkPicked, setNetworkPicked] = useState(false);
  const [paying, setPaying] = useState("");
  const [sameNumber, setSameNumber] = useState(true);
  const [account, setAccount] = useState("");
  const [errors, setErrors] = useState<{ paying?: string; account?: string; network?: string }>({});
  const [status, setStatus] = useState<PayStatus>("sending");
  const [result, setResult] = useState<PayResult | null>(null);
  const [outcome, setOutcome] = useState<DemoOutcome>("approved");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef<Step>("plan");
  const abortRef = useRef<AbortController | null>(null);

  const plan = plans[planIndex];
  const total = plan.months * plan.monthlyUgx;
  const payingNational = ugNationalNumber(paying);
  const accountNational = sameNumber ? payingNational : ugNationalNumber(account);
  const totalSteps = payMode === "demo" ? 3 : 2;

  useEffect(() => () => abortRef.current?.abort(), []);

  // Move focus to the new step's heading (not on first render).
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  function onPayingChange(value: string) {
    setPaying(value);
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
    if (!network) next.network = "Choose MTN MoMo or Airtel Money.";
    if (!sameNumber && !accountNational) next.account = "Enter the number you use in the EzyAgric App.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = next.paying ? "kaezy-paying" : next.network ? "kaezy-network-mtn" : "kaezy-account";
      document.getElementById(first)?.focus();
      return;
    }

    setStatus("sending");
    setStep("progress");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const final = await service.pay(
        {
          planName: plan.name,
          months: plan.months,
          amountUgx: total,
          network: network!,
          payingNumber: payingNational!,
          accountNumber: accountNational!,
        },
        { onStatus: setStatus, signal: controller.signal, demoOutcome: outcome },
      );
      setResult(final);
      setStep(final === "fulfilled" ? "done" : "failed");
    } catch {
      // Aborted: the visitor left the page.
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
      className="rounded-card border border-line bg-card p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-2xl font-heading tracking-heading text-heading">{hire.title}</h3>
        <p className="text-sm text-label-style text-label">
          Step {stepNumber} of {totalSteps}
        </p>
      </div>
      {payMode === "demo" ? (
        <p className="mt-2 rounded-control border border-dashed border-review bg-review-soft px-3 py-2 text-sm text-review">
          Demo: no request leaves this page and no money is taken.
        </p>
      ) : null}

      {step === "plan" ? (
        <form
          // method="dialog": before the scripts load, Continue does nothing
          // instead of reloading the page.
          method="dialog"
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setStep(payMode === "demo" ? "pay" : "app");
          }}
        >
          <h4 ref={headingRef} tabIndex={-1} className="text-lg font-heading text-title">
            Choose your plan
          </h4>
          <p className="mt-1 text-base text-muted">{hire.intro}</p>
          <fieldset className="mt-4">
            <legend className="sr-only">Ka-Ezy plan</legend>
            <div className="grid gap-3 md:grid-cols-3">
              {plans.map((p, i) => (
                <label
                  key={p.name}
                  className="group flex cursor-pointer items-start gap-3 rounded-card border-2 border-line p-4 transition-colors hover:border-secondary has-[:checked]:border-secondary has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
                >
                  <input
                    type="radio"
                    name="kaezy-plan"
                    checked={i === planIndex}
                    onChange={() => setPlanIndex(i)}
                    className="mt-1 size-5 shrink-0 accent-secondary focus-visible:outline-none"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-title">{p.name}</span>
                      {p.badge ? (
                        <span className="rounded-pill bg-accent px-2 py-0.5 text-xs font-label text-on-primary">
                          {p.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{planLine(p.months)}</span>
                    <span className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-sm text-body">{formatUgx(p.monthlyUgx)} a month</span>
                      {/* Darker green on the selected card's tint (4.5:1+). */}
                      <span className="font-heading text-accent group-has-[:checked]:text-accent-hover">
                        {formatUgx(p.months * p.monthlyUgx)}
                        <span className="font-label text-sm text-muted"> for {monthsText(p.months)}</span>
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <ul className="mt-5 space-y-2">
            {hire.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-base text-body">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-bright" />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <p>
              <span className="block text-sm text-muted">Pay today</span>
              <span className="text-2xl font-heading tracking-heading text-accent">{formatUgx(total)}</span>
            </p>
            <button
              type="submit"
              data-track="kaezy_hire_continue"
              data-track-plan={plan.name}
              className={`${buttonClasses("primary")} cursor-pointer`}
            >
              Continue
            </button>
          </div>
        </form>
      ) : null}

      {step === "pay" ? (
        <form method="dialog" className="mt-5" onSubmit={onPay} noValidate>
          <h4 ref={headingRef} tabIndex={-1} className="text-lg font-heading text-title">
            Pay with Mobile Money
          </h4>
          <PlanSummary plan={plan} total={total} onChange={() => restart("plan")} />

          <fieldset className="mt-5" aria-describedby={errors.network ? "kaezy-network-error" : undefined}>
            <legend className="text-base font-label text-title">Mobile Money network</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(Object.keys(NETWORKS) as Network[]).map((key) => (
                <label
                  key={key}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-card border-2 border-line px-3 transition-colors hover:border-secondary has-[:checked]:border-secondary has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
                >
                  <input
                    id={`kaezy-network-${key}`}
                    type="radio"
                    name="kaezy-network"
                    checked={network === key}
                    onChange={() => {
                      setNetwork(key);
                      setNetworkPicked(true);
                      setErrors((e) => ({ ...e, network: undefined }));
                    }}
                    className="size-5 shrink-0 accent-secondary focus-visible:outline-none"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
                  <img src={NETWORKS[key].logo} alt="" width={120} height={120} className="size-8 rounded-control" />
                  <span className="text-base font-label text-title">{NETWORKS[key].name}</span>
                </label>
              ))}
            </div>
            {errors.network ? <FieldError id="kaezy-network-error">{errors.network}</FieldError> : null}
          </fieldset>

          <PhoneField
            id="kaezy-paying"
            label="Mobile Money number"
            hint="The number that pays. You approve the payment on this phone."
            value={paying}
            onChange={onPayingChange}
            error={errors.paying}
          />

          <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-base text-body">
            <input
              type="checkbox"
              checked={sameNumber}
              onChange={(event) => setSameNumber(event.target.checked)}
              className="mt-1 size-5 shrink-0 accent-secondary"
            />
            I use this number in the EzyAgric App
          </label>
          {sameNumber ? (
            <p className="mt-1 pl-8 text-sm text-muted">{hire.accountHelp}</p>
          ) : (
            <PhoneField
              id="kaezy-account"
              label="EzyAgric App number"
              hint={hire.accountHelp}
              value={account}
              onChange={(value) => {
                setAccount(value);
                if (ugNationalNumber(value)) setErrors((e) => ({ ...e, account: undefined }));
              }}
              error={errors.account}
            />
          )}

          <p className="mt-5 flex items-start gap-2 text-sm text-muted">
            <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-accent-bright" />
            <span>
              <span className="font-label text-title">100% safe.</span> {hire.policy}
            </span>
          </p>

          <fieldset className="mt-5 rounded-control border border-dashed border-review bg-review-soft p-3">
            <legend className="px-1 text-sm font-label text-review">Demo only: what happens next?</legend>
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

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => restart("plan")}
              className={`${buttonClasses("secondary")} cursor-pointer`}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
              Back
            </button>
            <button
              type="submit"
              data-track="kaezy_hire_pay"
              data-track-plan={plan.name}
              data-track-network={network ?? "none"}
              className={`${buttonClasses("primary")} flex-1 cursor-pointer`}
            >
              Pay {formatUgx(total)}
            </button>
          </div>
        </form>
      ) : null}

      {step === "progress" ? (
        <div className="mt-5">
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
        <div className="mt-5">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent-bright text-on-accent">
            <Check aria-hidden="true" className="size-8" />
          </span>
          <h4 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-heading tracking-heading text-heading">
            Ka-Ezy is hired!
          </h4>
          <p className="mt-2 text-base text-body">
            Your {planLabel(plan.months)} is active on{" "}
            <span className="font-label text-title">
              {accountNational ? formatUgPhone(accountNational) : ""}
            </span>
            . Open the EzyAgric App and sign in with this number to start asking Ka-Ezy.
          </p>
          <div className="mt-5">{storeBadges}</div>
          <button
            type="button"
            onClick={() => restart("plan")}
            className={`${buttonClasses("secondary")} mt-6 cursor-pointer`}
          >
            Start again
          </button>
        </div>
      ) : null}

      {step === "failed" ? (
        <div className="mt-5">
          <XCircle aria-hidden="true" className="size-12 text-danger" />
          <h4 ref={headingRef} tabIndex={-1} className="mt-3 text-2xl font-heading tracking-heading text-heading">
            Payment not completed
          </h4>
          <p className="mt-2 text-base text-body">
            {result === "expired"
              ? "The prompt timed out before it was approved. No money was taken."
              : "Your payment did not go through. No money was taken."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => restart("pay")} className={`${buttonClasses("primary")} cursor-pointer`}>
              Try again
            </button>
            <button
              type="button"
              onClick={() => restart("plan")}
              className={`${buttonClasses("secondary")} cursor-pointer`}
            >
              Change plan
            </button>
          </div>
        </div>
      ) : null}

      {step === "app" ? (
        <div className="mt-5">
          <h4 ref={headingRef} tabIndex={-1} className="text-lg font-heading text-title">
            Finish in the EzyAgric App
          </h4>
          <PlanSummary plan={plan} total={total} onChange={() => restart("plan")} />
          <p className="mt-4 text-base text-body">{hire.appHandoff}</p>
          <div className="mt-5">{storeBadges}</div>
          <button
            type="button"
            onClick={() => restart("plan")}
            className={`${buttonClasses("secondary")} mt-6 cursor-pointer`}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
            Back
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PlanSummary({ plan, total, onChange }: { plan: HirePlan; total: number; onChange: () => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-control bg-subtle px-4 py-3">
      <p>
        <span className="block font-heading text-title">{planLabel(plan.months)}</span>
        <span className="text-lg font-heading text-accent">{formatUgx(total)}</span>
      </p>
      <button
        type="button"
        onClick={onChange}
        className="min-h-11 cursor-pointer rounded-control px-2 font-heading text-link hover:underline"
      >
        Change<span className="sr-only"> plan</span>
      </button>
    </div>
  );
}

function PhoneField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="mt-5">
      <label htmlFor={id} className="text-base font-label text-title">
        {label}
      </label>
      <p id={`${id}-hint`} className="mt-0.5 text-sm text-muted">
        {hint}
      </p>
      <div
        className={`mt-2 flex min-h-12 items-center overflow-hidden rounded-control border-2 bg-canvas focus-within:border-secondary ${
          error ? "border-danger" : "border-line"
        }`}
      >
        <span aria-hidden="true" className="self-stretch border-r border-line bg-subtle px-3 py-3 text-base font-label text-muted">
          +256
        </span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="772 123 456"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-title outline-none placeholder:text-muted"
        />
      </div>
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-label text-danger">
      <XCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
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
