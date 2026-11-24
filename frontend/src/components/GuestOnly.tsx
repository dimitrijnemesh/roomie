"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getToken, subscribeAuth } from "@/lib/session";

const isAuthed = () => !!getToken();

/**
 * Pages for guests only (landing, sign-up, verify, login).
 * A logged-in user is sent to /app; to see these pages again, log out.
 */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authed = useSyncExternalStore(subscribeAuth, isAuthed, () => false);

  useEffect(() => {
    if (authed) router.replace("/app");
  }, [authed, router]);

  return authed ? null : children;
}
