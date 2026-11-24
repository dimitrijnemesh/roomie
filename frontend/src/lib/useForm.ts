"use client";

import { useCallback, useState } from "react";
import { shake } from "./motion";

type Errors<K extends string> = Partial<Record<K, string | undefined>>;

/**
 * Small form helper: values, client validation and server errors per field.
 * A field shows its client error after it was left non-empty (blur) or after a submit attempt.
 */
export function useForm<K extends string>(initial: Record<K, string>, validate: (v: Record<K, string>) => Errors<K>) {
  // Callback ref kept in state (not a ref object) so it is safe to read during render.
  const [form, attachForm] = useState<HTMLFormElement | null>(null);
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Errors<K>>({});

  const clientErrors = validate(values);
  const keys = Object.keys(initial) as K[];
  const errors = Object.fromEntries(
    keys.map((k) => [k, serverErrors[k] ?? (touched[k] ? clientErrors[k] : undefined)]),
  ) as Errors<K>;

  function bind(k: K) {
    return {
      value: values[k],
      error: errors[k],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setValues((prev) => ({ ...prev, [k]: v }));
        setServerErrors((prev) => (prev[k] !== undefined ? { ...prev, [k]: undefined } : prev));
      },
      onBlur: () => {
        if (values[k]) setTouched((prev) => ({ ...prev, [k]: true }));
      },
    };
  }

  function focusAndShake(invalid: K[]) {
    invalid.forEach((k) => shake(form?.querySelector(`[data-field="${k}"] input`)));
    form?.querySelector<HTMLInputElement>(`[data-field="${invalid[0]}"] input`)?.focus();
  }

  /** Call on submit: shows all errors, shakes invalid fields, focuses the first. Returns true if valid. */
  function check(): boolean {
    setTouched(Object.fromEntries(keys.map((k) => [k, true])) as Record<K, boolean>);
    const invalid = keys.filter((k) => clientErrors[k]);
    if (invalid.length) focusAndShake(invalid);
    return invalid.length === 0;
  }

  function setServerError(k: K, message: string) {
    setServerErrors((prev) => ({ ...prev, [k]: message }));
    focusAndShake([k]);
  }

  /** Highlight fields red (no text under them) — e.g. when the message is shown above the form. */
  function markInvalid(ks: K[]) {
    setServerErrors((prev) => ({ ...prev, ...Object.fromEntries(ks.map((k) => [k, ""])) }));
    focusAndShake(ks);
  }

  const setValue = useCallback((k: K, v: string) => setValues((prev) => ({ ...prev, [k]: v })), []);

  // initial is a fresh object literal each render — keep reset stable by reading it once.
  const [initialValues] = useState(initial);
  const reset = useCallback(() => {
    setValues(initialValues);
    setTouched({});
    setServerErrors({});
  }, [initialValues]);

  return { attachForm, values, errors, bind, check, setServerError, markInvalid, setValue, reset };
}
