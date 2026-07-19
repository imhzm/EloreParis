import { shellCopy, type Locale } from "@/lib/i18n";
import styles from "./trust-service-strip.module.css";

/**
 * §7.7 Trust / Service strip — five service-status statements above the
 * footer. Operational benefits remain approval-gated, so this surface says
 * what is verified or pending instead of publishing promises.
 */

const icons: Record<string, React.ReactNode> = {
  delivery: (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M3 9.5A1.5 1.5 0 0 1 4.5 8h12a1.5 1.5 0 0 1 1.5 1.5V21H3V9.5Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M18 12h5.2a2 2 0 0 1 1.7 1l3.1 5v3h-10V12Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="9" cy="23.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="23" cy="23.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  samples: (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 4c3.4 4.2 6 7.4 6 10.6A6 6 0 0 1 10 14.6C10 11.4 12.6 8.2 16 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13 15.2a3 3 0 0 0 3 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M16 20.5V27M12 24l4 3 4-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  packaging: (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M5 13h22v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V13Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 9.5A1.5 1.5 0 0 1 5.5 8h21A1.5 1.5 0 0 1 28 9.5V13H4V9.5Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 8v19" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 8c-1.8-3.4-6.2-2.6-5 .6.7 1.9 5 -.6 5 -.6Zm0 0c1.8-3.4 6.2-2.6 5 .6-.7 1.9-5-.6-5-.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  ingredients: (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M25 6c0 9-5.5 15-13 15-2 0-3.6-.5-3.6-.5S8 9 25 6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 27c1-6 5-11 13-15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  returns: (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 16a9 9 0 1 0 2.7-6.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 5v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

type TrustStripCopy = {
  serviceStripTitle: string;
  serviceStrip: Array<[string, string, string]> | ReadonlyArray<readonly [string, string, string]>;
};

export function TrustServiceStrip({ locale = "ar", copy: controlledCopy }: { locale?: Locale; copy?: TrustStripCopy }) {
  const copy = controlledCopy ?? shellCopy[locale];

  return (
    <section className={styles.strip} aria-label={copy.serviceStripTitle}>
      <ul className={styles.row}>
        {copy.serviceStrip.map(([icon, line1, line2]) => (
          <li key={line1} className={styles.item}>
            <span className={styles.icon}>{icons[icon]}</span>
            <span className={styles.label}>
              <b>{line1}</b>
              <small>{line2}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
