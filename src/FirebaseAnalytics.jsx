"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getFirebaseAnalytics } from "./firebase";

export default function FirebaseAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    getFirebaseAnalytics()
      .then(async (analytics) => {
        if (!active || !analytics) return;
        const { logEvent } = await import("firebase/analytics");
        if (active) logEvent(analytics, "page_view", { page_path: pathname });
      })
      .catch(() => {
        // Analytics must never prevent the app from rendering.
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  return null;
}
