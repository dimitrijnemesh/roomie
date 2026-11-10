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

export function Brand({ size = 40, hideWordmarkOnPhone = false }: { size?: number; hideWordmarkOnPhone?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Roomie — на головну">
      <Logo size={size} />
      <Wordmark className={`text-xl ${hideWordmarkOnPhone ? "max-[420px]:hidden" : ""}`} />
    </Link>
  );
}

const variants = {
  primary: "bg-mint text-ink hover:bg-[#35b98a]",
  secondary: "bg-ink text-white hover:bg-[#1b443b]",
  outline: "border-2 border-line bg-white text-ink hover:border-mint",
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
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function Field({
  label,
  id,
  error,
  ...props
}: ComponentProps<"input"> & { label: string; id: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-body">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className={`h-12 rounded-[14px] border-2 bg-white px-4 text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-mint ${
          error ? "border-warning" : "border-line"
        }`}
        {...props}
      />
      {error && <p className="text-sm text-warning">{error}</p>}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[2px] text-mint-dark sm:text-sm">{children}</p>
  );
}
