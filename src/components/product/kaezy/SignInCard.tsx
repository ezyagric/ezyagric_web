"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { LogIn, ShieldCheck } from "lucide-react";
import { PARTNER_DEFAULT_ORG } from "@/lib/env";
import { ugNationalNumber } from "./format";
import { PhoneField } from "./PhoneField";
import { buttonClasses } from "@/components/ui/Button";
import { snackbar } from "@/components/ui/Snackbar";
import { fill, type Profile, type TryIt } from "./personalise";
import { PartnerError, requestCode, signInWithCode, signOut, useArrival, type Session } from "./partner";
import { SMALL_SECONDARY } from "./Thread";

const FIELD =
  "min-h-12 w-full min-w-0 rounded-control border-2 border-line bg-canvas px-3 text-base text-title placeholder:text-muted disabled:bg-subtle disabled:text-muted";
const LABEL = "block text-sm font-label text-title";

type Copy = TryIt["signIn"];

/** The API's refusal, in the card's words. */
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

/**
 * "Sign in for the real Ka-Ezy": beside "Your farm". The visitor gives an
 * organisation's code and their phone, gets an SMS code and signs in; a
 * returning visitor stays signed in for the day. A link from the
 * organisation can fill the fields in, or (with a token) sign the visitor
 * in at once. Signed in, the card shows who, and the demo answers for real.
 */
export function SignInCard({
  copy,
  session,
  profile,
  className = "",
}: {
  copy: Copy;
  session: Session | null;
  /** "Your farm", for the name field's starting value. */
  profile: Profile;
  className?: string;
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
  const [code, setCode] = useState("");
  const [typedName, setTypedName] = useState<string | null>(null);
  // "Your farm" already has a first name: start from it.
  const name = typedName ?? profile.name.trim();
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<"details" | "code">("details");
  const [busy, setBusy] = useState<"send" | "signin" | "signout" | null>(null);
  const [sandbox, setSandbox] = useState(false);
  const [error, setError] = useState("");
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const fixed = { org: !!link?.org, phone: !!link?.phone };
  // From a link the phone is masked: the user types their own number, with the mask as a hint.
  const phoneHint = link?.phoneMasked && !link.phone ? `${copy.phoneHint} ${fill(copy.phoneMaskedHint, profile, { masked: link.phoneMasked })}` : copy.phoneHint;
  // Why the link did not sign the visitor in, until they sign in some other way.
  const failure = link?.failure ?? null;
  const notice =
    !failure || noticeDismissed
      ? ""
      : failure.code === "sign_in_link_used"
        ? copy.linkUsed
        : failure.code === "sign_in_link_expired"
          ? copy.linkExpired
          : failure.status === 403
            ? explain(copy, failure)
            : copy.linkInvalid;

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy("send");
    try {
      const out = await requestCode(orgCode.trim(), phone.trim());
      setSandbox(out.sandbox);
      setStep("code");
      snackbar.show(out.sandbox ? copy.sandboxCode : fill(copy.toasts.codeSent, profile, { phone: phone.trim() }), "info");
      window.setTimeout(() => codeRef.current?.focus(), 0);
    } catch (failure) {
      setError(explain(copy, failure));
    } finally {
      setBusy(null);
    }
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!agreed) return setError(copy.errors.needConsent);
    setError("");
    setBusy("signin");
    try {
      await signInWithCode(orgCode.trim(), phone.trim(), code.trim(), { name, termsVersion: copy.termsVersion });
      setCode("");
      setNoticeDismissed(true);
      window.setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 0);
    } catch (failure) {
      setError(explain(copy, failure));
    } finally {
      setBusy(null);
    }
  }

  async function leave() {
    if (busy) return;
    setBusy("signout");
    await signOut();
    setBusy(null);
    setStep("details");
    setNoticeDismissed(true);
    setError("");
  }

  const who = session ? session.name || session.phone : "";

  return (
    <section aria-labelledby="kaezy-signin-title" className={className}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-secondary"
        >
          {session ? <ShieldCheck className="size-5" /> : <LogIn className="size-5" />}
        </span>
        <h3 ref={headingRef} tabIndex={-1} id="kaezy-signin-title" className="text-lg font-heading text-title">
          {copy.title}
        </h3>
      </div>

      {session ? (
        <div className="mt-3">
          <p className="text-sm text-body">
            {fill(copy.signedIn, profile, { who, org: session.organisation.name || session.organisation.orgCode })}
            {session.organisation.sandbox ? (
              <span className="ml-2 inline-flex rounded-pill bg-accent-soft px-2 py-0.5 text-xs font-label text-accent">
                {copy.sandboxBadge}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-muted">
            {session.organisation.orgCode} · {session.phone}
          </p>
          <button
            type="button"
            onClick={() => void leave()}
            disabled={busy !== null}
            data-track="kaezy_sign_out"
            className={`${SMALL_SECONDARY} mt-3 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {copy.signOut}
          </button>
        </div>
      ) : link?.linking ? (
        <p role="status" className="mt-3 text-sm text-muted">
          {copy.linkSigningIn}
        </p>
      ) : (
        <form
          method="dialog"
          onSubmit={step === "details" ? sendCode : signIn}
          noValidate
          className="mt-3"
          aria-describedby="kaezy-signin-intro"
        >
          <p id="kaezy-signin-intro" className="text-sm text-muted">
            {copy.intro}
          </p>
          {notice ? (
            <p role="status" className="mt-2 rounded-control bg-brand-soft px-3 py-2 text-sm text-title">
              {notice}
            </p>
          ) : null}
          {fixed.org || fixed.phone ? (
            <p className="mt-2 text-xs text-muted">
              {copy.fromLink}
              {link?.orgName ? ` ${link.orgName}.` : ""}
            </p>
          ) : null}

          <label htmlFor="kaezy-signin-name" className={`mt-3 ${LABEL}`}>
            {copy.fullName}
          </label>
          <input
            id="kaezy-signin-name"
            type="text"
            value={name}
            onChange={(event) => setTypedName(event.target.value)}
            disabled={step === "code"}
            autoComplete="name"
            maxLength={120}
            aria-describedby="kaezy-signin-name-hint"
            className={`mt-1 ${FIELD}`}
          />
          <p id="kaezy-signin-name-hint" className="mt-1 text-xs text-muted">
            {copy.fullNameHint}
          </p>

          <PhoneField
            id="kaezy-signin-phone"
            label={copy.phone}
            hint={phoneHint}
            value={phoneShown}
            onChange={setTypedPhone}
            readOnly={fixed.phone || step === "code"}
            error={step === "details" && typedPhone.trim() && !national ? copy.errors.badPhone : undefined}
          />

          {askOrg ? (
            <>
              <label htmlFor="kaezy-signin-org" className={`mt-3 ${LABEL}`}>
                {copy.orgCode}
              </label>
              <input
                id="kaezy-signin-org"
                type="text"
                value={orgCode}
                onChange={(event) => setTypedOrg(event.target.value)}
                disabled={fixed.org || step === "code"}
                autoComplete="off"
                autoCapitalize="none"
                placeholder="ezyorg482913"
                aria-describedby="kaezy-signin-org-hint"
                className={`mt-1 ${FIELD}`}
              />
              <p id="kaezy-signin-org-hint" className="mt-1 text-xs text-muted">
                {copy.orgCodeHint}
              </p>
            </>
          ) : step === "details" ? (
            <button
              type="button"
              onClick={() => setWantsOrg(true)}
              className="mt-2 min-h-11 cursor-pointer rounded-control px-1 text-sm font-label text-link underline underline-offset-4"
            >
              {copy.orgToggle}
            </button>
          ) : null}

          {step === "code" ? (
            <>
              <p role="status" className="mt-3 text-sm text-body">
                {sandbox ? copy.sandboxCode : fill(copy.codeSent, profile, { phone: phone.trim() })}
              </p>
              <label htmlFor="kaezy-signin-code" className={`mt-3 ${LABEL}`}>
                {copy.code}
              </label>
              <input
                ref={codeRef}
                id="kaezy-signin-code"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className={`mt-1 ${FIELD} tracking-[0.3em]`}
              />
              <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-body">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-secondary"
                />
                <span>
                  {copy.consent}{" "}
                  <Link href="/privacy-policy/" className="font-label text-link underline underline-offset-4">
                    {copy.consentLink}
                  </Link>
                  .
                </span>
              </label>
            </>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 text-sm font-label text-danger">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy !== null || !orgCode.trim() || !phone.trim() || !name.trim() || (step === "code" && code.length < 6)}
              data-track={step === "details" ? "kaezy_sign_in_code" : "kaezy_sign_in"}
              className={`${buttonClasses("primary")} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {step === "details" ? (busy === "send" ? copy.sending : copy.sendCode) : busy === "signin" ? copy.signingIn : copy.submit}
            </button>
            {step === "code" ? (
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setError("");
                }}
                disabled={busy !== null}
                className={`${SMALL_SECONDARY} disabled:opacity-60`}
              >
                {copy.back}
              </button>
            ) : null}
          </div>
        </form>
      )}
    </section>
  );
}
