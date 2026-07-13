import { TrackedLink } from "@/components/tracked-link";
import styles from "./breadcrumb.module.css";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className={styles.breadcrumb} aria-label="مسار التنقل">
        <ol className={styles.list}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={`${item.label}-${index}`} className={styles.item}>
                {index > 0 && (
                  <svg
                    className={styles.separator}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M7.5 3L4.5 6l3 3"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isLast || !item.href ? (
                  <span
                    className={`${styles.label} ${isLast ? styles.labelCurrent : ""}`}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <TrackedLink
                    href={item.href}
                    className={styles.link}
                    analyticsEvent="navigation_click"
                    analyticsLabel={`breadcrumb_${item.href.replaceAll("/", "_").replace(/^_+/, "")}`}
                    analyticsSurface="breadcrumb"
                  >
                    {item.label}
                  </TrackedLink>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
