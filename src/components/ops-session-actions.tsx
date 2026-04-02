"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { getOpsAuthMethodLabel } from "@/lib/ops-access";
import type { OpsSessionSummary } from "@/lib/ops-types";
import styles from "./order-flow.module.css";

type OpsSessionActionsProps = {
  session: OpsSessionSummary | null;
};

export function OpsSessionActions({ session }: OpsSessionActionsProps) {
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
      {session ? (
        <span className={styles.opsNavMeta}>
          Session: {session.role} · {session.username ?? session.userId} ·{" "}
          {getOpsAuthMethodLabel(session.authMethod)}
        </span>
      ) : null}
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
