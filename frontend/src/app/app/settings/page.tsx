import type { Metadata } from "next";
import { Settings } from "./Settings";

export const metadata: Metadata = { title: "Налаштування — Roomie" };

export default function SettingsPage() {
  return <Settings />;
}
