import type { Metadata } from "next";
import { ComingSoon } from "@/components/AppShell";

export const metadata: Metadata = { title: "Налаштування — Roomie" };

export default function SettingsPage() {
  return <ComingSoon title="Налаштування" text="Тут можна буде змінити пароль і видалити акаунт." />;
}
