import type { Metadata } from "next";
import { AppHome } from "./AppHome";

export const metadata: Metadata = { title: "Стрічка — Roomie" };

export default function AppPage() {
  return <AppHome />;
}
