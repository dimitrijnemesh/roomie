"use client";

import { useState, type ComponentProps } from "react";
import { FieldError, inputClass } from "@/components/ui";

// Password-generator hint for Safari/iCloud Keychain (others use minlength/maxlength) — same rules as the backend.
export const NEW_PASSWORD_RULES = "minlength: 8; maxlength: 72; required: lower; required: upper; required: digit; required: special;";

export function PasswordField({
  label,
  id,
  error,
  children,
  passwordRules,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  label: string;
  id: string;
  error?: string;
  /** Set on sign-up so password managers generate a password that passes our rules. */
  passwordRules?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div className="flex flex-col gap-1.5" data-field={id}>
      <label htmlFor={id} className="text-sm font-medium text-body">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass(error !== undefined)} pr-12`}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          {...(passwordRules ? { passwordrules: passwordRules, minLength: 8, maxLength: 72 } : {})}
          {...props}
          onBlur={(e) => {
            setCapsLock(false);
            props.onBlur?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Сховати пароль" : "Показати пароль"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted hover:text-ink"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {visible ? (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3 3.8M6.6 6.6C4 8.3 2.5 12 2.5 12S6 19 12 19a9.6 9.6 0 0 0 5.4-1.6" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              </>
            ) : (
              <>
                <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
      {capsLock && (
        <p className="flex animate-fade-in items-center gap-1.5 text-sm font-medium text-mint-dark" role="status">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 4 4 12h4v4h8v-4h4z" />
            <path d="M8 20h8" />
          </svg>
          Увімкнено Caps Lock
        </p>
      )}
      {children}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/** Live checklist under the new-password field. */
export function PasswordRules({ rules }: { rules: { id: string; label: string; ok: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Вимоги до пароля">
      {rules.map((r) => (
        <li
          key={r.id}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            r.ok ? "bg-mint text-ink" : "bg-mint-tint text-muted"
          }`}
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {r.ok ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />}
          </svg>
          {r.label}
          <span className="sr-only">{r.ok ? " — виконано" : " — ще ні"}</span>
        </li>
      ))}
    </ul>
  );
}
