"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import styles from "./order-flow.module.css";

export function OpsSessionActions() {
  const pathname = usePathname() ?? "/ops";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleLogout() {
    setError(null);

    try {
      await fetch("/api/ops-access/logout", {
        method: "POST",
      });

      trackAnalyticsEvent("cta_click", {
        label: "ops_logout",
        surface: "ops_nav",
        source_path: pathname,
        source_page_type: getPageType(pathname),
        destination_path: "/ops-access",
        destination_type: getPageType("/ops-access"),
      });

      startTransition(() => {
        router.push("/ops-access");
        router.refresh();
      });
    } catch {
      setError("تعذر إنهاء الجلسة الآن.");
    }
  }

  return (
    <div className={styles.opsNavActions}>
      <button
        type="button"
        className={styles.opsNavButton}
        onClick={handleLogout}
        disabled={isPending}
      >
        {isPending ? "جارٍ الخروج..." : "خروج"}
      </button>
      {error ? <span className={styles.opsNavMeta}>{error}</span> : null}
    </div>
  );
}
