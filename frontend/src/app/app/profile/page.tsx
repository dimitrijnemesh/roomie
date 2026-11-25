import type { Metadata } from "next";
import { MyProfile } from "./MyProfile";

export const metadata: Metadata = { title: "Моя анкета — Roomie" };

export default function ProfilePage() {
  return <MyProfile />;
}
