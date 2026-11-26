import type { Metadata } from "next";
import { ComingSoon } from "@/components/AppShell";

export const metadata: Metadata = { title: "Метчі — Roomie" };

export default function MatchesPage() {
  return <ComingSoon title="Метчі" text="Тут будуть люди, з якими ви сподобались одне одному, і чат із ними. З’явиться в наступному спринті." />;
}
