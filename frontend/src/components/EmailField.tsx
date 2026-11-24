"use client";

import type { ComponentProps } from "react";
import { Field } from "@/components/ui";
import { EMAIL_PLACEHOLDER, UNIVERSITIES } from "@/lib/universities";
import { suggestEmail } from "@/lib/validation";

const DOMAINS = UNIVERSITIES.map((u) => u.domain);

/** University email input: right keyboard on phones, no autocorrect, typo hint for the domain. */
export function EmailField({
  value,
  onSuggest,
  ...props
}: Omit<ComponentProps<typeof Field>, "label" | "id" | "value"> & {
  value: string;
  onSuggest: (email: string) => void;
}) {
  const suggestion = props.error ? suggestEmail(value, DOMAINS) : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Field
        id="email"
        label="Пошта"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        placeholder={EMAIL_PLACEHOLDER}
        value={value}
        {...props}
      />
      {suggestion && (
        <button
          type="button"
          onClick={() => onSuggest(suggestion)}
          className="animate-fade-in self-start rounded-full bg-mint-tint px-3 py-1.5 text-left text-sm text-body hover:bg-line/60"
        >
          Можливо, <span className="font-medium text-mint-dark underline underline-offset-2">{suggestion}</span>?
        </button>
      )}
    </div>
  );
}
