"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useLocalStorageValue(key: string, fallback: string): string {
  return useSyncExternalStore(subscribe, () => window.localStorage.getItem(key) ?? fallback, () => fallback);
}
