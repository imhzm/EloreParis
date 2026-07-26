"use client";

import { useEffect, useMemo, useState } from "react";

function formatElapsed(date: Date, now: number): string {
  const seconds = Math.floor((now - date.getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  return `منذ ${hours} س`;
}

type OpsLastUpdatedProps = {
  lastFetched: Date | null;
  onRefresh: () => void;
  isLoading?: boolean;
};

export function OpsLastUpdated({ lastFetched, onRefresh, isLoading }: OpsLastUpdatedProps) {
  const [tick, setTick] = useState(0);
  const elapsed = useMemo(() => {
    if (!lastFetched) return "";
    return formatElapsed(lastFetched, Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFetched, tick]);

  useEffect(() => {
    if (!lastFetched) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, [lastFetched]);

  if (!lastFetched) return null;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "inherit", opacity: 0.65 }}>
      <span>{elapsed}</span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, fontSize: "inherit", textDecoration: "underline", opacity: isLoading ? 0.4 : 1 }}
        aria-label="تحديث"
      >
        {isLoading ? "…" : "تحديث"}
      </button>
    </span>
  );
}
