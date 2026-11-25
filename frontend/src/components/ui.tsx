import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";

export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/roomie-logo.svg"
      alt="Roomie"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold text-ink ${className}`}>
      Roomie<span className="text-mint">.</span>
    </span>
  );
}

export function Brand({
  size = 40,
  hideWordmarkOnPhone = false,
  href = "/",
}: {
  size?: number;
  hideWordmarkOnPhone?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="Roomie — на головну">
      <Logo size={size} />
      <Wordmark className={`text-xl ${hideWordmarkOnPhone ? "max-[420px]:hidden" : ""}`} />
    </Link>
  );
}

const variants = {
  primary: "bg-mint text-ink hover:bg-[#35b98a]",
  secondary: "bg-ink text-white hover:bg-[#1b443b]",
  outline: "border-2 border-line bg-white text-ink hover:border-mint",
  danger: "bg-warning text-white hover:bg-[#963a09]",
} as const;

type Variant = keyof typeof variants;

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mint-dark disabled:cursor-not-allowed disabled:opacity-50";

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Button({
  variant = "primary",
  className = "",
  loading = false,
  disabled,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      className={buttonClass(variant, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const inputClass = (invalid?: boolean) =>
  `h-12 w-full rounded-[14px] border-2 px-4 text-ink outline-none transition-colors placeholder:text-muted/70 ${
    invalid ? "border-warning bg-warning/5 focus:border-warning" : "border-line bg-white focus:border-mint"
  }`;

export function FieldError({ id, children }: { id: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="flex animate-fade-in items-start gap-1.5 text-sm text-warning">
      <svg className="mt-0.5 size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7.5v5.5M12 16.5h.01" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

export function Field({
  label,
  id,
  error,
  ...props
}: ComponentProps<"input"> & { label: string; id: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5" data-field={id}>
      <label htmlFor={id} className="text-sm font-medium text-body">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass(error !== undefined)}
        {...props}
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/** Form-level message (server errors etc.) with an optional action. */
export function Alert({
  tone = "error",
  children,
  action,
}: {
  tone?: "error" | "info";
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const styles = tone === "error" ? "bg-warning/8 text-warning border-warning/30" : "bg-mint-tint text-mint-dark border-line";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`animate-fade-in rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      <p>{children}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Full-screen success state: a mint circle with a check that draws itself. */
export function SuccessOverlay({ title, text }: { title: string; text?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex animate-fade-in flex-col items-center justify-center bg-paper/95 px-6 text-center backdrop-blur-sm"
    >
      <div className="flex size-28 animate-pop items-center justify-center rounded-full bg-mint shadow-float">
        <svg className="size-14 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} className="animate-draw [stroke-dasharray:1] [stroke-dashoffset:1]" />
        </svg>
      </div>
      <h2 className="mt-8 animate-rise font-display text-2xl font-bold sm:text-3xl">{title}</h2>
      {text && <p className="mt-3 max-w-sm animate-rise text-body [animation-delay:120ms]">{text}</p>}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[2px] text-mint-dark sm:text-sm">{children}</p>
  );
}
