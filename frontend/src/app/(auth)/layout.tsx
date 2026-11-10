import { Brand } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-mint-tint/60">
      <header className="mx-auto flex h-[60px] w-full max-w-6xl items-center px-4 sm:h-[72px] sm:px-6">
        <Brand size={36} />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-float sm:p-10">{children}</div>
      </main>
      <p className="pb-6 text-center text-sm text-muted">Тільки для студентів вишів Львова</p>
    </div>
  );
}
