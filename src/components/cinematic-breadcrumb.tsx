"use client";

import { keepFocusVisible } from "@/components/scene-primitives";
import { TrackedLink } from "@/components/tracked-link";
import styles from "./cinematic-breadcrumb.module.css";

export type CrumbItem = { label: string; href?: string };

/**
 * The wayfinding trail the reference seats at the top of every dark cinematic
 * hero (product and collection). Visual only — the pages emit their own
 * BreadcrumbList JSON-LD, so this must not add a second one. The chevron is
 * drawn from borders and mirrors by direction, and every label reads against
 * the burgundy scene.
 */
export function CinematicBreadcrumb({
  items,
  label,
}: {
  items: CrumbItem[];
  label: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav className={styles.breadcrumb} aria-label={label}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {index > 0 && <span className={styles.separator} aria-hidden="true" />}
              {item.href && !isLast ? (
                <TrackedLink
                  href={item.href}
                  onFocus={keepFocusVisible}
                  className={styles.link}
                  analyticsLabel={`breadcrumb_${index}`}
                  analyticsSurface="breadcrumb"
                >
                  {item.label}
                </TrackedLink>
              ) : (
                <span
                  className={styles.current}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
