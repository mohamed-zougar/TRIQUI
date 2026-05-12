"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { authApi, getStoredUser, getToken, type AuthSummary } from "./api";

const STORAGE_KEY = "triqi_user";

let lastRawUser: string | null = null;
let cachedUser: AuthSummary | null = null;

function subscribe(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === "triqi_token") listener();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getSnapshot(): AuthSummary | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== lastRawUser) {
    lastRawUser = raw;
    try {
      cachedUser = raw ? JSON.parse(raw) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

function getServerSnapshot(): AuthSummary | null {
  return null;
}

export function useStoredUser(): AuthSummary | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useRequireAuth() {
  const router = useRouter();
  const user = useStoredUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isReady = mounted && user !== null;

  useEffect(() => {
    if (!mounted) return;
    const token = getToken();
    if (!token || !user) {
      router.replace("/login");
    }
  }, [mounted, router, user]);

  const setUser = (next: AuthSummary | null) => {
    if (typeof window === "undefined") return;
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  };

  return { user, isReady, setUser };
}

export function useOptionalUser() {
  const user = useStoredUser();
  return { user };
}

export function logout() {
  authApi.logout();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }
}
