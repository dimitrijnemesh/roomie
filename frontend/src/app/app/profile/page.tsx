import type { Metadata } from "next";
import { ComingSoon } from "@/components/AppShell";

export const metadata: Metadata = { title: "Моя анкета — Roomie" };

export default function ProfilePage() {
  return <ComingSoon title="Моя анкета" text="Тут можна буде переглянути й змінити свою анкету." />;
}
