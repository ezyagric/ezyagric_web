"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Loader2, MessageSquareText, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { POPUP, closeOnBackdrop } from "@/components/ui/Popup";
import { PARTNER_DEFAULT_ORG } from "@/lib/env";
import { track } from "@/lib/track";
import { formatUgPhone, ugNationalNumber } from "./format";
import { FieldError, PhoneField } from "./PhoneField";
import { fill, type Profile, type TryIt } from "./personalise";
import { PartnerError, isFresh, requestCode, signInWithCode, useArrival, type Session } from "./partner";
import { KaEzyAvatar } from "./Thread";

const FIELD =
  "min-h-12 w-full min-w-0 rounded-control border-2 border-line bg-canvas px-3 text-base text-title autofill:shadow-[inset_0_0_0_100rem_var(--color-canvas)] placeholder:text-muted disabled:bg-subtle disabled:text-muted";
const LABEL = "block text-base font-label text-title";

/** The API keeps a code for 5 minutes (copy.codeSent says so). */
const CODE_SECONDS = 5 * 60;
/** A new code can be asked for after this long. */
const RESEND_AFTER_SECONDS = 30;
const CODE_LENGTH = 6;
/** The welcome stays this long, then the popup goes by itself. */
const WELCOME_MS = 2600;

type Copy = TryIt["signIn"];

/** The API's refusal, in the popup's words. */
function explain(copy: Copy, error: unknown): string {
  if (!(error instanceof PartnerError)) return copy.errors.generic;
  const e = copy.errors;
  switch (error.code) {
    case "unknown_org_code":
      return e.unknownOrg;
    case "user_blocked":
    case "account_suspended":
      return e.blocked;
    case "user_limit_reached":
      return e.limit;
    case "otp_invalid":
    case "otp_expired":
    case "otp_not_found":
      return e.badCode;
    case "otp_cooldown":
    case "otp_rate_limited":
    case "otp_attempts_exceeded":
      return e.tooMany;
    case "profile_required":
      return e.needName;
    case "consent_required":
      return e.needConsent;
    case "invalid_phone":
      return e.badPhone;
    default:
      // A 422 from the API names the bad field in plain words; the rest get one line.
      return error.status === 422 && error.message ? error.message : e.generic;
  }
}

/** 272 -> "4:32" */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * "Sign in for the real Ka-Ezy": a popup over the Ka-Ezy window, with Ka-Ezy
 * talking the visitor through it from a speech bubble (their name goes in as
 * they type it). The visitor gives their name and phone (and an organisation's
 * code, if they have one), agrees to the terms, gets an SMS code and types it:
 * six boxes that sign in by themselves on the last digit, autofill and paste
 * included. A link from the organisation can fill the fields in, or (with a
 * token) sign the visitor in at once. A sign-in on this page ends on a short
 * welcome; a returning visitor stays signed in for the day.
 */
export function SignInPopup({
  copy,
  session,
  profile,
  avatar,
  areaId,
  open,
  onClose,
}: {
  copy: Copy;
  session: Session | null;
  /** "Your farm", for the name field's starting value. */
  profile: Profile;
  avatar: string;
  /** The Ka-Ezy window: brought into view first, so the popup opens over it. */
  areaId: string;
  /** Asked for: the window's "Sign in" button, or a link. It stays up for the welcome. */
  open: boolean;
  /** It closed: Esc, its close button, the backdrop, or the welcome ending. */
  onClose: () => void;
}) {
  // The link the page was opened with: its org and phone are fixed, and a
  // token signs the visitor in on its own (partner.ts).
  const link = useArrival();
  const [typedOrg, setTypedOrg] = useState("");
  const [typedPhone, setTypedPhone] = useState("");
  // Visitors without an organisation code join EzyAgric's own organisation
  // (PARTNER_DEFAULT_ORG); the code field is behind "I have a code".
  const [wantsOrg, setWantsOrg] = useState(false);
  const askOrg = !!link?.org || !PARTNER_DEFAULT_ORG || wantsOrg;
  const orgCode = link?.org || (askOrg ? typedOrg : PARTNER_DEFAULT_ORG);
  // The field shows the national number behind +256 (as the payment screen
  // does); the API gets the international form. A link's phone is shown the same way.
  const linkNational = link?.phone ? ugNationalNumber(link.phone) : null;
  const phoneShown = linkNational ? `${linkNational.slice(0, 3)} ${linkNational.slice(3, 6)} ${linkNational.slice(6)}` : typedPhone;
  const national = linkNational ?? ugNationalNumber(typedPhone);
  const phone = national ? `256${national}` : link?.phone || "";
  const phonePretty = national ? formatUgPhone(national) : phone;
  const [code, setCode] = useState("");
  const [typedName, setTypedName] = useState<string | null>(null);
  // "Your farm" already has a first name: start from it.
  const name = typedName ?? profile.name.trim();
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<"details" | "code">("details");
  const [busy, setBusy] = useState<"send" | "signin" | null>(null);
  const [sandbox, setSandbox] = useState(false);
  const [error, setError] = useState("");
  // The code's clock: when it was sent, and now (ticking while the code step shows).
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(0);
  // Each wrong code shakes the boxes once more.
  const [shakes, setShakes] = useState(0);
  // A new code asked for from the code step, so it is announced too.
  const [resends, setResends] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  const elapsed = Math.floor((now - sentAt) / 1000);
  const secondsLeft = Math.max(0, CODE_SECONDS - elapsed);
  const resendIn = Math.max(0, RESEND_AFTER_SECONDS - elapsed);

  // Signed in on this page just now: the welcome. A session restored from
  // storage is not news, and the popup never opens for it.
  const welcoming = !!session && isFresh(session);
  const show = open && (!session || welcoming);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (show && !dialog.open) {
      document.getElementById(areaId)?.scrollIntoView({ block: "center", behavior: "instant" });
      dialog.showModal();
      // With a mouse, straight into the first empty field. On a touch screen
      // the keyboard would cover the popup before it has been read.
      if (window.matchMedia("(pointer: fine)").matches) {
        [...dialog.querySelectorAll("input")].find((input) => input.type !== "checkbox" && !input.value && !input.readOnly && !input.disabled)?.focus();
      }
    } else if (!show && dialog.open) {
      dialog.close();
    }
  }, [show, areaId]);

  useEffect(() => {
    if (!show || !welcoming) return;
    startRef.current?.focus({ preventScroll: true });
    const timer = window.setTimeout(() => dialogRef.current?.close(), WELCOME_MS);
    return () => window.clearTimeout(timer);
  }, [show, welcoming]);

  useEffect(() => {
    if (step !== "code" || !show) return;
    const ticking = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(ticking);
  }, [step, show]);

  // A code has just been sent: the cursor goes to its boxes, and the phone can
  // offer the code from the SMS.
  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step, sentAt]);

  const fixed = { org: !!link?.org, phone: !!link?.phone };
  // From a link the phone is masked: the user types their own number, with the mask as a hint.
  const phoneHint = link?.phoneMasked && !link.phone ? `${copy.phoneHint} ${fill(copy.phoneMaskedHint, profile, { masked: link.phoneMasked })}` : copy.phoneHint;
  // Why the link did not sign the visitor in.
  const failure = link?.failure ?? null;
  const notice = !failure
    ? ""
    : failure.code === "sign_in_link_used"
      ? copy.linkUsed
      : failure.code === "sign_in_link_expired"
        ? copy.linkExpired
        : failure.status === 403
          ? explain(copy, failure)
          : copy.linkInvalid;

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    if (!agreed) return setError(copy.errors.needConsent);
    setError("");
    setBusy("send");
    try {
      const out = await requestCode(orgCode.trim(), phone.trim());
      const sent = Date.now();
      setSandbox(out.sandbox);
      setSentAt(sent);
      setNow(sent);
      setCode("");
      if (step === "code") setResends((n) => n + 1);
      setStep("code");
    } catch (refused) {
      setError(explain(copy, refused));
    } finally {
      setBusy(null);
    }
  }

  async function signIn(value: string) {
    if (busy) return;
    setError("");
    setBusy("signin");
    try {
      await signInWithCode(orgCode.trim(), phone.trim(), value, { name, termsVersion: copy.termsVersion });
      // The next person to sign in on this page starts from a clean form.
      setCode("");
      setStep("details");
      setTypedName(null);
      setTypedPhone("");
      setTypedOrg("");
      setWantsOrg(false);
      setAgreed(false);
      setSandbox(false);
      setSentAt(0);
      setNow(0);
      setShakes(0);
      setResends(0);
    } catch (refused) {
      setError(explain(copy, refused));
      setCode("");
      setShakes((n) => n + 1);
      window.setTimeout(() => codeRef.current?.focus(), 0);
    } finally {
      setBusy(null);
    }
  }

  function typeCode(value: string) {
    // A whole pasted SMS works: its six-digit run, whatever else it says.
    const digits = value.match(/\b\d{6}\b/)?.[0] ?? value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setError("");
    // The last digit signs in: typed, pasted or filled in from the SMS.
    if (digits.length === CODE_LENGTH && code.length < CODE_LENGTH) {
      track("kaezy_sign_in", { position: "auto" });
      void signIn(digits);
    }
  }

  const bubble = session
    ? fill(copy.welcome, profile, { name: (session.name || firstName).split(/\s+/)[0] ?? "" })
    : link?.linking
      ? copy.linkSigningIn
      : step === "code"
        ? sandbox
          ? copy.sandboxCode
          : // Non-breaking, so the number stays on one line of the bubble.
            fill(copy.codeSent, profile, { phone: phonePretty.replace(/ /g, "\u00a0") })
        : fill(copy.greeting, profile, { name: firstName });
  const stepNumber = !session && step === "details" ? 1 : 2;
  const announcement =
    !session && !link?.linking && step === "details"
      ? ""
      : resends && !session
        ? fill(copy.toasts.codeSent, profile, { phone: phonePretty })
        : bubble;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="kaezy-signin-title"
      onClick={closeOnBackdrop}
      onClose={onClose}
      className={`${POPUP} max-w-3xl`}
    >
      <div className="relative grid md:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Over the gradient on phones, over the white form from md. */}
        <button
          type="button"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
          className="absolute top-3 right-3 z-10 flex size-11 cursor-pointer items-center justify-center rounded-pill transition-colors max-md:bg-inverse/25 max-md:text-on-inverse max-md:hover:bg-inverse/50 max-md:focus-visible:outline-focus-inverse md:text-muted md:hover:bg-subtle"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        {/* Each step, for screen readers: never the greeting, which changes with every letter of the name. */}
        <p role="status" className="sr-only">
          {announcement}
        </p>

        {/* Ka-Ezy, talking the visitor through it. */}
        <div className="gradient-brand relative isolate flex flex-col overflow-hidden p-4 pr-16 text-on-inverse md:min-h-[33rem] md:p-6">
          <span
            aria-hidden="true"
            className="absolute -bottom-32 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full border border-on-inverse/15 max-md:hidden"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-24 left-1/2 -z-10 size-80 -translate-x-1/2 rounded-full border border-on-inverse/25 max-md:hidden"
          />
          <p className="text-xs text-label-style text-on-inverse">
            Step {stepNumber} of 2
          </p>
          <span aria-hidden="true" className="mt-2 flex max-w-36 gap-1.5">
            {[1, 2].map((n) => (
              <span
                key={n}
                className={`h-1.5 flex-1 rounded-pill transition-colors duration-500 ${n <= stepNumber ? "bg-on-inverse" : "bg-on-inverse/25"}`}
              />
            ))}
          </span>
          <div className="mt-3 flex items-start gap-2.5 md:mt-5">
            <span className="md:hidden">
              <KaEzyAvatar src={avatar} size="lg" />
            </span>
            <p
              className="relative min-w-0 flex-1 rounded-card bg-card px-3 py-2 text-sm text-title shadow-raised md:px-4 md:py-3 md:text-base"
            >
              {bubble}
              {/* The bubble's tail: towards the avatar on phones, Ka-Ezy from md. */}
              <span
                aria-hidden="true"
                className="absolute size-3 rotate-45 bg-card max-md:top-4 max-md:-left-1 md:-bottom-1 md:left-1/2 md:-translate-x-1/2"
              />
            </p>
          </div>
          {/* Ka-Ezy rising in a white disc, like the window's avatar (this
              artwork has a white background). */}
          <span
            aria-hidden="true"
            className="absolute -bottom-16 left-1/2 -z-10 size-64 -translate-x-1/2 overflow-hidden rounded-full bg-card max-md:hidden motion-safe:animate-[soon-rise_420ms_ease-out]"
          >
            <Image
              src="/images/products/ka-ezy-full.webp"
              alt=""
              width={640}
              height={1312}
              sizes="208px"
              className="absolute top-4 left-1/2 w-52 max-w-none -translate-x-1/2"
            />
          </span>
        </div>

        <div className="flex min-w-0 flex-col p-5 md:p-7">
          {session ? (
            <div key="welcome" className="my-auto flex flex-col items-center py-6 text-center motion-safe:animate-[popup-in_260ms_ease-out]">
              <span className="flex size-16 items-center justify-center rounded-full bg-accent-bright text-on-accent">
                <Check aria-hidden="true" className="size-9" />
              </span>
              <h2 id="kaezy-signin-title" className="mt-4 text-2xl font-heading tracking-heading">
                {fill(copy.signedIn, profile, {
                  who: session.name || session.phone,
                  org: session.organisation.name || session.organisation.orgCode,
                })}
              </h2>
              <button
                ref={startRef}
                type="button"
                onClick={() => dialogRef.current?.close()}
                className={`mt-5 cursor-pointer ${buttonClasses("primary")}`}
              >
                {copy.start}
              </button>
            </div>
          ) : link?.linking ? (
            <div key="linking" className="my-auto flex flex-col items-center py-6 text-center">
              <Loader2 aria-hidden="true" className="size-10 text-secondary motion-safe:animate-spin" />
              <h2 id="kaezy-signin-title" className="mt-4 text-2xl font-heading tracking-heading">
                {copy.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{copy.linkSigningInHint}</p>
              {link.orgName || link.org || link.phoneMasked || link.phone ? (
                <p className="mt-1 text-sm text-title">
                  {[link.orgName || link.org, link.phoneMasked || link.phone].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          ) : (
            <form key={step} onSubmit={step === "details" ? sendCode : (event) => {
              event.preventDefault();
              void signIn(code);
            }} noValidate className="my-auto motion-safe:animate-[snack-in_200ms_ease-out]">
              <h2 id="kaezy-signin-title" className="pr-10 text-2xl font-heading tracking-heading">
                {/* "Ka-Ezy" stays whole on a narrow phone. */}
                {copy.title.split(/(Ka-Ezy)/).map((part, i) =>
                  i % 2 === 1 ? (
                    <span key={i} className="whitespace-nowrap">
                      {part}
                    </span>
                  ) : (
                    part
                  ),
                )}
              </h2>
              {notice ? (
                <p role="status" className="mt-3 rounded-control bg-brand-soft px-3 py-2 text-sm text-title">
                  {notice}
                </p>
              ) : null}
              {fixed.org || fixed.phone ? (
                <p className="mt-2 text-xs text-muted">
                  {copy.fromLink}
                  {link?.orgName ? ` ${link.orgName}.` : ""}
                </p>
              ) : null}

              {step === "details" ? (
                <>
                  <label htmlFor="kaezy-signin-name" className={`mt-4 ${LABEL}`}>
                    {copy.fullName}
                  </label>
                  <p id="kaezy-signin-name-hint" className="mt-0.5 text-sm text-muted">
                    {copy.fullNameHint}
                  </p>
                  <input
                    id="kaezy-signin-name"
                    type="text"
                    value={name}
                    onChange={(event) => setTypedName(event.target.value)}
                    // Held while the code is on its way: it goes to what was sent.
                    readOnly={busy !== null}
                    autoComplete="name"
                    maxLength={120}
                    aria-describedby="kaezy-signin-name-hint"
                    className={`mt-2 ${FIELD}`}
                  />

                  <PhoneField
                    id="kaezy-signin-phone"
                    label={copy.phone}
                    hint={phoneHint}
                    value={phoneShown}
                    onChange={setTypedPhone}
                    readOnly={fixed.phone || busy !== null}
                    error={typedPhone.trim() && !national ? copy.errors.badPhone : undefined}
                  />

                  {askOrg ? (
                    <>
                      <label htmlFor="kaezy-signin-org" className={`mt-4 ${LABEL}`}>
                        {copy.orgCode}
                      </label>
                      <p id="kaezy-signin-org-hint" className="mt-0.5 text-sm text-muted">
                        {copy.orgCodeHint}
                      </p>
                      <input
                        id="kaezy-signin-org"
                        type="text"
                        value={orgCode}
                        onChange={(event) => setTypedOrg(event.target.value)}
                        disabled={fixed.org}
                        readOnly={busy !== null}
                        autoComplete="off"
                        autoCapitalize="none"
                        placeholder="ezyorg482913"
                        aria-describedby="kaezy-signin-org-hint"
                        className={`mt-2 ${FIELD}`}
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setWantsOrg(true)}
                      disabled={busy !== null}
                      className="mt-1 min-h-11 cursor-pointer rounded-control text-sm font-label text-link underline underline-offset-4"
                    >
                      {copy.orgToggle}
                    </button>
                  )}

                  <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-control border border-line bg-subtle p-3 text-sm text-body transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                    <input
                      type="checkbox"
                      checked={agreed}
                      disabled={busy !== null}
                      onChange={(event) => {
                        setAgreed(event.target.checked);
                        setError("");
                      }}
                      className="mt-0.5 size-5 shrink-0 accent-accent"
                    />
                    <span>
                      {copy.consent.split(/(\{terms\}|\{policy\})/).map((part) =>
                        part === "{terms}" || part === "{policy}" ? (
                          // A new tab: the page behind holds what has been typed.
                          <Link
                            key={part}
                            href={part === "{terms}" ? "/terms-and-conditions/" : "/privacy-policy/"}
                            target="_blank"
                            rel="noopener"
                            className="font-label text-link underline underline-offset-4"
                          >
                            {part === "{terms}" ? copy.consentTerms : copy.consentPolicy}
                          </Link>
                        ) : (
                          part
                        ),
                      )}
                    </span>
                  </label>
                </>
              ) : (
                <>
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 text-base text-title">
                    <span className="font-label tabular-nums">{phonePretty}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("details");
                        setCode("");
                        setError("");
                        setResends(0);
                      }}
                      disabled={busy !== null}
                      className="min-h-11 cursor-pointer rounded-control text-sm font-label text-link underline underline-offset-4 disabled:opacity-60"
                    >
                      {copy.back}
                    </button>
                  </p>

                  <label htmlFor="kaezy-signin-code" className={`mt-2 ${LABEL}`}>
                    {copy.code}
                  </label>
                  {/* One real input over six drawn boxes, so typing, paste, the
                      phone's SMS autofill and screen readers all see one field. */}
                  <div className="group relative mt-2">
                    <div
                      key={shakes}
                      aria-hidden="true"
                      className={`grid grid-cols-6 gap-1.5 sm:gap-2 ${shakes ? "motion-safe:animate-[code-shake_320ms_ease-out]" : ""} ${busy === "signin" ? "opacity-60" : ""}`}
                    >
                      {Array.from({ length: CODE_LENGTH }, (_, i) => {
                        const active = i === Math.min(code.length, CODE_LENGTH - 1);
                        return (
                          <span
                            key={i}
                            className={`flex h-14 items-center justify-center rounded-control border-2 text-2xl font-heading text-title tabular-nums transition-colors ${
                              error && !code ? "border-danger" : code[i] ? "border-secondary bg-brand-soft" : "border-line bg-canvas"
                            } ${active ? "group-has-[input:focus]:border-secondary group-has-[input:focus]:ring-3 group-has-[input:focus]:ring-secondary/20" : ""}`}
                          >
                            {code[i] ?? (active ? <span className="hidden h-7 w-0.5 bg-secondary group-has-[input:focus]:block motion-safe:animate-pulse" /> : null)}
                          </span>
                        );
                      })}
                    </div>
                    <input
                      ref={codeRef}
                      id="kaezy-signin-code"
                      type="text"
                      value={code}
                      onChange={(event) => typeCode(event.target.value)}
                      readOnly={busy !== null}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? "kaezy-signin-error" : undefined}
                      className="absolute inset-0 size-full cursor-text bg-transparent text-base text-transparent caret-transparent outline-none selection:bg-transparent"
                    />
                  </div>

                  {/* The code's clock: a line running out, then a new code. */}
                  <span aria-hidden="true" className="mt-3 block h-1 overflow-hidden rounded-pill bg-subtle">
                    <span
                      className={`block h-full rounded-pill transition-[width] duration-1000 ease-linear motion-reduce:transition-none ${secondsLeft < 60 ? "bg-danger" : "bg-accent-bright"}`}
                      style={{ width: `${(secondsLeft / CODE_SECONDS) * 100}%` }}
                    />
                  </span>
                  <p className="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-sm text-muted">
                    <span role="timer" className={secondsLeft ? "tabular-nums" : "font-label text-danger"}>
                      {secondsLeft ? fill(copy.validFor, profile, { time: clock(secondsLeft) }) : copy.expired}
                    </span>
                    <button
                      type="button"
                      onClick={() => void sendCode()}
                      disabled={busy !== null || resendIn > 0}
                      data-track="kaezy_sign_in_resend"
                      className="min-h-11 cursor-pointer rounded-control font-label text-link underline underline-offset-4 tabular-nums disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                    >
                      {resendIn > 0 ? fill(copy.resendIn, profile, { time: clock(resendIn) }) : copy.resend}
                    </button>
                  </p>
                </>
              )}

              {error ? <FieldError id="kaezy-signin-error">{error}</FieldError> : null}

              <button
                type="submit"
                disabled={busy !== null || !orgCode.trim() || !phone.trim() || !name.trim() || (step === "code" && code.length < CODE_LENGTH)}
                data-track={step === "details" ? "kaezy_sign_in_code" : "kaezy_sign_in"}
                className={`mt-4 w-full cursor-pointer ${buttonClasses("primary")} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {busy ? (
                  <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />
                ) : step === "details" ? (
                  <MessageSquareText aria-hidden="true" className="size-5" />
                ) : null}
                {step === "details" ? (busy === "send" ? copy.sending : copy.sendCode) : busy === "signin" ? copy.signingIn : copy.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
}
