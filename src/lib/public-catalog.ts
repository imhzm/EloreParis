import "server-only";

import { getAuthorityDatabase } from "@/lib/authority-database";
import { getActiveCatalogAuthority } from "@/lib/catalog-authority";
import { isPublicCatalogApproved } from "@/lib/release-controls";
import { safePublicMediaUrl } from "@/lib/public-media-url";
import type {
  PublicCatalogLocale,
  PublicCatalogProduct,
  PublicCatalogSnapshot,
} from "@/lib/public-catalog-types";

type InventoryBalanceRow = {
  sku: string;
  available_units: number;
};

function unavailableSnapshot(locale: PublicCatalogLocale): PublicCatalogSnapshot {
  return {
    available: false,
    locale,
    products: [],
  };
}

export function getPublicCatalogSnapshot(
  locale: PublicCatalogLocale,
): PublicCatalogSnapshot {
  if (!isPublicCatalogApproved()) return unavailableSnapshot(locale);

  const catalog = getActiveCatalogAuthority();
  if (!catalog) return unavailableSnapshot(locale);

  const balanceRows = getAuthorityDatabase().prepare(`
    SELECT sku, SUM(on_hand - reserved - safety_stock) AS available_units
    FROM authority_inventory_balances
    WHERE import_id = ?
    GROUP BY sku
  `).all(catalog.importId) as InventoryBalanceRow[];
  const balances = new Map(balanceRows.map((row) => [row.sku, row]));
  const defaultShipping = catalog.payload.shippingMethods.find(
    (method) => method.enabled,
  );
  const shippingNote = defaultShipping
    ? locale === "ar"
      ? defaultShipping.estimatedDeliveryAr
      : defaultShipping.estimatedDeliveryEn
    : "";

  const products = catalog.payload.products
    .filter((product) => product.status === "approved")
    .map<PublicCatalogProduct>((product) => {
      const media = product.media.flatMap((item) => {
        const url = safePublicMediaUrl(item.url);
        return url
          ? [{ url, alt: locale === "ar" ? item.altAr : item.altEn }]
          : [];
      });
      const variants = product.variants
        .filter((variant) => variant.status === "approved")
        .map((variant) => {
          const balance = balances.get(variant.sku);
          const available = Boolean(
            balance &&
              balance.available_units > 0,
          );

          return {
            sku: variant.sku,
            label: locale === "ar" ? variant.labelAr : variant.labelEn,
            size: variant.size,
            grossHalalas: variant.grossHalalas,
            compareAtHalalas: variant.compareAtHalalas,
            price: variant.grossHalalas / 100,
            compareAtPrice:
              variant.compareAtHalalas === null
                ? null
                : variant.compareAtHalalas / 100,
            availability: available ? "InStock" : "OutOfStock",
          } as const;
        });

      return {
        collection: product.collection,
        slug: product.slug,
        name: locale === "ar" ? product.nameAr : product.nameEn,
        subtitle:
          locale === "ar" ? product.descriptionAr : product.descriptionEn,
        brand: product.brand,
        finish:
          (locale === "ar"
            ? product.compliance.productFunctionAr
            : product.compliance.productFunctionEn) ?? "",
        shippingNote,
        ingredientsInci: product.compliance.fullInci,
        directions:
          locale === "ar"
            ? product.compliance.directionsAr
            : product.compliance.directionsEn,
        storage:
          locale === "ar"
            ? product.compliance.storageAr
            : product.compliance.storageEn,
        warnings:
          locale === "ar"
            ? product.compliance.warningsAr
            : product.compliance.warningsEn,
        countryOfOrigin: product.compliance.countryOfOrigin,
        expiry:
          product.compliance.expiryMode === "expiry" &&
          product.compliance.shelfLifeMonths !== null
            ? { mode: "expiry" as const, months: product.compliance.shelfLifeMonths }
            : product.compliance.expiryMode === "pao" &&
                product.compliance.paoMonths !== null
              ? { mode: "pao" as const, months: product.compliance.paoMonths }
              : null,
        approvedClaims: product.claims.flatMap((claim) =>
          claim.locale === locale && claim.status === "approved"
            ? [claim.exactText]
            : [],
        ),
        returns: {
          windowDays: product.returnProfile.returnWindowDays,
          hygieneSealRequired: product.returnProfile.hygieneSealRequired,
          openedReturnEligible: product.returnProfile.openedReturnEligible,
          exceptionReason:
            locale === "ar"
              ? product.returnProfile.exceptionReasonAr
              : product.returnProfile.exceptionReasonEn,
          policyVersion: product.returnProfile.approvedPolicyVersion ?? "",
        },
        media,
        pairings: [],
        questions: [],
        variants,
      };
    })
    .filter((product) => product.media.length > 0 && product.variants.length > 0);

  return {
    available: products.length > 0,
    locale,
    products,
  };
}
