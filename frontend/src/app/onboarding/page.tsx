import type { Metadata } from "next";
import { Onboarding } from "./Onboarding";

export const metadata: Metadata = { title: "Анкета — Roomie" };

export default function OnboardingPage() {
  return <Onboarding />;
}
