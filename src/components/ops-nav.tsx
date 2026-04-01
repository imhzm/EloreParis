import { TrackedLink } from "@/components/tracked-link";
import styles from "./order-flow.module.css";

type OpsNavProps = {
  activeHref: string;
};

const opsLinks = [
  {
    href: "/ops",
    label: "Dashboard",
    analyticsLabel: "ops_nav_dashboard",
    destinationType: "ops_dashboard",
  },
  {
    href: "/ops/orders",
    label: "Orders",
    analyticsLabel: "ops_nav_orders",
    destinationType: "ops_orders",
  },
  {
    href: "/ops/fulfillment",
    label: "Fulfillment",
    analyticsLabel: "ops_nav_fulfillment",
    destinationType: "ops_fulfillment",
  },
  {
    href: "/ops/catalog",
    label: "Catalog",
    analyticsLabel: "ops_nav_catalog",
    destinationType: "ops_catalog",
  },
];

export function OpsNav({ activeHref }: OpsNavProps) {
  return (
    <nav className={styles.opsNav} aria-label="Internal operations navigation">
      {opsLinks.map((link) => {
        const isActive =
          link.href === "/ops"
            ? activeHref === "/ops"
            : activeHref.startsWith(link.href);

        return (
          <TrackedLink
            key={link.href}
            href={link.href}
            analyticsLabel={link.analyticsLabel}
            analyticsSurface="ops_nav"
            analyticsDestinationType={link.destinationType}
            className={`${styles.opsNavLink} ${isActive ? styles.opsNavLinkActive : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </TrackedLink>
        );
      })}
    </nav>
  );
}
