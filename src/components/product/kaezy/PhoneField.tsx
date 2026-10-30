"use client";

import type { ReactNode } from "react";
import { XCircle } from "lucide-react";

// A Ugandan phone number field, as the payment screen draws it: the country
// code (+256) fixed on the left, the national number typed on the right.
// Shared by "Pay for Ka-Ezy here" and the sign-in card.

export function PhoneField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  readOnly = false,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Shown, not editable (the signed-in number). */
  readOnly?: boolean;
}) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className="text-base font-label text-title">
        {label}
      </label>
      <p id={`${id}-hint`} className="mt-0.5 text-sm text-muted">
        {hint}
      </p>
      <div
        className={`mt-2 flex min-h-12 items-center overflow-hidden rounded-control border-2 focus-within:border-secondary ${
          readOnly ? "bg-subtle" : "bg-canvas"
        } ${error ? "border-danger" : "border-line"}`}
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
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-title outline-none placeholder:text-muted"
        />
      </div>
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-label text-danger">
      <XCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}
