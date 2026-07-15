import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  getAuthorityDatabase,
  runAuthorityTransaction,
} from "@/lib/authority-database";
import {
  parseCatalogImportPayload,
  type CatalogApprovalType,
  type CatalogImportPayload,
  type CatalogImportProduct,
} from "@/lib/catalog-authority-types";

const quarantinedProductSlugs = new Set([
  "radiant-dew-serum",
  "velvet-base-foundation",
]);
const quarantinedSkus = new Set(["RD-30", "RD-50", "VBF-02", "VBF-04"]);

type CatalogImportRow = {
  id: string;
  source_ref: string;
  source_hash: string;
  status: "validated" | "active" | "retired";
  product_count: number;
  variant_count: number;
  created_by: string;
  created_at: string;
  activated_at: string | null;
  payload_json: string;
};

export class CatalogAuthorityError extends Error {
  statusCode: number;
  code: string;
  issues: string[];

  constructor(code: string, message: string, statusCode = 400, issues: string[] = []) {
    super(message);
    this.name = "CatalogAuthorityError";
    this.code = code;
    this.statusCode = statusCode;
    this.issues = issues;
  }
}

function parseImportRow(row: CatalogImportRow) {
  const validation = parseCatalogImportPayload(JSON.parse(row.payload_json) as unknown);
  if (!validation.ok) {
    throw new CatalogAuthorityError(
      "catalog_storage_invalid",
      "Stored catalog authority payload no longer satisfies the validated contract.",
      500,
      validation.issues,
    );
  }
  return validation.value;
}

function approvalKey(subjectType: string, subjectId: string, approvalType: string) {
  return `${subjectType}:${subjectId.toLowerCase()}:${approvalType}`;
}

function hasRequiredCompliance(product: CatalogImportProduct) {
  const compliance = product.compliance;
  const expiryReady =
    compliance.expiryMode === "expiry"
      ? compliance.shelfLifeMonths !== null
      : compliance.expiryMode === "pao"
        ? compliance.paoMonths !== null
        : false;

  return Boolean(
    compliance.notificationStatus === "active" &&
    compliance.sfdaNotificationId &&
    compliance.ecosmaProductReference &&
    compliance.safetyStandardVersion &&
    compliance.claimsStandardVersion &&
    compliance.manufacturerName &&
    compliance.manufacturerAddress &&
    compliance.manufacturerCountry &&
    compliance.saudiImporterName &&
    compliance.saudiImporterAddress &&
    compliance.saudiImporterLicense &&
    compliance.productFunctionAr &&
    compliance.productFunctionEn &&
    compliance.fullInci &&
    compliance.storageAr &&
    compliance.storageEn &&
    compliance.directionsAr &&
    compliance.directionsEn &&
    compliance.warningsAr.length &&
    compliance.warningsEn.length &&
    compliance.countryOfOrigin &&
    compliance.internalLabelArtworkRef &&
    compliance.externalLabelArtworkRef &&
    compliance.publicImageRightsEvidence &&
    expiryReady
  );
}

export type CatalogAuthorityReadiness = {
  ready: boolean;
  importId: string | null;
  productCount: number;
  variantCount: number;
  blockers: string[];
};

export function evaluateCatalogImportReadiness(
  payload: CatalogImportPayload,
  importId: string | null = null,
): CatalogAuthorityReadiness {
  const blockers = new Set<string>();
  const approvals = new Set(
    payload.approvals
      .filter((approval) => approval.status === "approved")
      .map((approval) =>
        approvalKey(
          approval.subjectType,
          approval.subjectId,
          approval.approvalType,
        )),
  );

  if (!payload.products.length) blockers.add("catalog_empty");
  if (!approvals.has(approvalKey("catalog", "catalog", "publication"))) {
    blockers.add("catalog_publication_approval_missing");
  }
  if (!approvals.has(approvalKey("catalog", "catalog", "price"))) {
    blockers.add("catalog_pricing_approval_missing");
  }
  if (
    !payload.shippingMethods.length ||
    payload.shippingMethods.some(
      (method) => !method.enabled || !method.evidenceRef,
    )
  ) {
    blockers.add("shipping_methods_incomplete");
  }

  let variantCount = 0;
  for (const product of payload.products) {
    if (quarantinedProductSlugs.has(product.slug)) blockers.add("quarantined_product_present");
    if (product.status !== "approved") blockers.add(`product_not_approved:${product.slug}`);
    if (!hasRequiredCompliance(product)) blockers.add(`product_compliance_incomplete:${product.slug}`);
    if (!product.media.length || product.media.some((media) => !media.rightsEvidenceRef)) {
      blockers.add(`product_media_incomplete:${product.slug}`);
    }
    if (!product.returnProfile.approvedPolicyVersion) {
      blockers.add(`product_return_policy_missing:${product.slug}`);
    }
    if (product.claims.some((claim) => claim.status !== "approved" || !claim.evidenceRefs.length)) {
      blockers.add(`product_claims_unapproved:${product.slug}`);
    }

    for (const requiredType of ["data", "media", "claims", "compliance"] as CatalogApprovalType[]) {
      if (!approvals.has(approvalKey("product", product.slug, requiredType))) {
        blockers.add(`product_${requiredType}_approval_missing:${product.slug}`);
      }
    }

    for (const variant of product.variants) {
      variantCount += 1;
      if (quarantinedSkus.has(variant.sku)) blockers.add("quarantined_sku_present");
      if (variant.status !== "approved") blockers.add(`variant_not_approved:${variant.sku}`);
      if (variant.grossHalalas <= 0) blockers.add(`variant_price_invalid:${variant.sku}`);
      if (!approvals.has(approvalKey("variant", variant.sku, "price"))) {
        blockers.add(`variant_price_approval_missing:${variant.sku}`);
      }
    }
  }

  return {
    ready: blockers.size === 0,
    importId,
    productCount: payload.products.length,
    variantCount,
    blockers: [...blockers].sort(),
  };
}

function assertApprovalSubjectsExist(payload: CatalogImportPayload) {
  const productSlugs = new Set(payload.products.map((product) => product.slug.toLowerCase()));
  const skus = new Set(
    payload.products.flatMap((product) =>
      product.variants.map((variant) => variant.sku.toLowerCase()),
    ),
  );
  const invalid = payload.approvals.filter((approval) => {
    if (approval.subjectType === "catalog") return approval.subjectId === "catalog" ? false : true;
    if (approval.subjectType === "product") return !productSlugs.has(approval.subjectId.toLowerCase());
    return !skus.has(approval.subjectId.toLowerCase());
  });

  if (invalid.length) {
    throw new CatalogAuthorityError(
      "catalog_approval_subject_invalid",
      "One or more approval records reference a product, variant, or catalog subject that does not exist.",
      400,
      invalid.map((approval) => `${approval.subjectType}:${approval.subjectId}:${approval.approvalType}`),
    );
  }
}

export function importCatalogAuthorityDraft(value: unknown, actor: string) {
  const validation = parseCatalogImportPayload(value);
  if (!validation.ok) {
    throw new CatalogAuthorityError(
      "catalog_import_invalid",
      "Catalog import failed validation.",
      400,
      validation.issues,
    );
  }

  const payload = validation.value;
  assertApprovalSubjectsExist(payload);
  const payloadJson = JSON.stringify(payload);
  const sourceHash = createHash("sha256").update(payloadJson).digest("hex");
  const importId = `catalog_${randomUUID()}`;
  const taxProfileId = `tax_${randomUUID()}`;
  const locationId = `location_${payload.inventoryLocation.code.toLowerCase()}`;
  const createdAt = new Date().toISOString();
  const variantCount = payload.products.reduce(
    (count, product) => count + product.variants.length,
    0,
  );

  try {
    runAuthorityTransaction((database) => {
      database.prepare(`
        INSERT INTO authority_catalog_imports (
          id, source_ref, source_hash, status, product_count, variant_count,
          created_by, created_at, activated_at, payload_json
        ) VALUES (?, ?, ?, 'validated', ?, ?, ?, ?, NULL, ?)
      `).run(
        importId,
        payload.sourceRef,
        sourceHash,
        payload.products.length,
        variantCount,
        actor,
        createdAt,
        payloadJson,
      );

      database.prepare(`
        INSERT INTO authority_tax_profiles (
          id, import_id, jurisdiction_code, rate_bps, prices_include_tax,
          evidence_ref, approved_by, approved_at
        ) VALUES (?, ?, 'SA', ?, 1, ?, ?, ?)
      `).run(
        taxProfileId,
        importId,
        payload.taxProfile.rateBps,
        payload.taxProfile.evidenceRef,
        payload.taxProfile.approvedBy,
        payload.taxProfile.approvedAt,
      );

      database.prepare(`
        INSERT INTO authority_inventory_locations (id, code, name, status)
        VALUES (?, ?, ?, 'active')
        ON CONFLICT(code) DO UPDATE SET name = excluded.name, status = 'active'
      `).run(locationId, payload.inventoryLocation.code, payload.inventoryLocation.name);

      const insertProduct = database.prepare(`
        INSERT INTO authority_catalog_products (
          import_id, slug, collection, brand, status, name_ar, name_en, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertVariant = database.prepare(`
        INSERT INTO authority_catalog_variants (
          import_id, sku, product_slug, barcode, status, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      const insertPrice = database.prepare(`
        INSERT INTO authority_catalog_prices (
          import_id, sku, currency, gross_halalas, compare_at_halalas, tax_profile_id
        ) VALUES (?, ?, 'SAR', ?, ?, ?)
      `);
      const insertBalance = database.prepare(`
        INSERT INTO authority_inventory_balances (
          import_id, sku, location_id, on_hand, reserved, safety_stock, version, updated_at
        ) VALUES (?, ?, ?, ?, 0, ?, 1, ?)
      `);

      for (const product of payload.products) {
        insertProduct.run(
          importId,
          product.slug,
          product.collection,
          product.brand,
          product.status,
          product.nameAr,
          product.nameEn,
          JSON.stringify(product),
        );
        for (const variant of product.variants) {
          insertVariant.run(
            importId,
            variant.sku,
            product.slug,
            variant.barcode,
            variant.status,
            JSON.stringify(variant),
          );
          insertPrice.run(
            importId,
            variant.sku,
            variant.grossHalalas,
            variant.compareAtHalalas,
            taxProfileId,
          );
          insertBalance.run(
            importId,
            variant.sku,
            locationId,
            variant.stockOnHand,
            variant.safetyStock,
            createdAt,
          );
        }
      }

      const insertApproval = database.prepare(`
        INSERT INTO authority_catalog_approvals (
          id, import_id, subject_type, subject_id, approval_type, status,
          evidence_ref, approved_by, decided_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const approval of payload.approvals) {
        insertApproval.run(
          `approval_${randomUUID()}`,
          importId,
          approval.subjectType,
          approval.subjectId,
          approval.approvalType,
          approval.status,
          approval.evidenceRef,
          approval.approvedBy,
          approval.decidedAt,
        );
      }
    });
  } catch (error) {
    if (error instanceof CatalogAuthorityError) throw error;
    if (error instanceof Error && /UNIQUE constraint failed: authority_catalog_imports.source_hash/i.test(error.message)) {
      throw new CatalogAuthorityError(
        "catalog_import_duplicate",
        "This exact catalog payload has already been imported.",
        409,
      );
    }
    throw error;
  }

  return {
    importId,
    sourceHash,
    readiness: evaluateCatalogImportReadiness(payload, importId),
  };
}

function readImport(importId: string) {
  return getAuthorityDatabase().prepare(`
    SELECT id, source_ref, source_hash, status, product_count, variant_count,
           created_by, created_at, activated_at, payload_json
    FROM authority_catalog_imports
    WHERE id = ?
  `).get(importId) as CatalogImportRow | undefined;
}

export function publishCatalogAuthorityImport(importId: string, actor: string) {
  const row = readImport(importId);
  if (!row) {
    throw new CatalogAuthorityError(
      "catalog_import_not_found",
      "Catalog import was not found.",
      404,
    );
  }
  const payload = parseImportRow(row);
  const readiness = evaluateCatalogImportReadiness(payload, importId);
  if (!readiness.ready) {
    throw new CatalogAuthorityError(
      "catalog_import_not_ready",
      "Catalog import cannot be published until every evidence gate passes.",
      409,
      readiness.blockers,
    );
  }

  const now = new Date().toISOString();
  runAuthorityTransaction((database) => {
    database.prepare(`
      UPDATE authority_catalog_publications SET status = 'retired'
      WHERE status = 'active'
    `).run();
    database.prepare(`
      UPDATE authority_catalog_imports SET status = 'retired'
      WHERE status = 'active'
    `).run();
    database.prepare(`
      INSERT INTO authority_catalog_publications (
        id, import_id, status, content_hash, approved_by, approved_at, activated_at
      ) VALUES (?, ?, 'active', ?, ?, ?, ?)
      ON CONFLICT(import_id) DO UPDATE SET
        status = 'active', content_hash = excluded.content_hash,
        approved_by = excluded.approved_by, approved_at = excluded.approved_at,
        activated_at = excluded.activated_at
    `).run(
      `publication_${randomUUID()}`,
      importId,
      row.source_hash,
      actor,
      now,
      now,
    );
    database.prepare(`
      UPDATE authority_catalog_imports
      SET status = 'active', activated_at = ?
      WHERE id = ?
    `).run(now, importId);
  });

  return { importId, activatedAt: now, readiness };
}

export function getCatalogAuthorityReadiness(): CatalogAuthorityReadiness {
  const row = getAuthorityDatabase().prepare(`
    SELECT i.id, i.source_ref, i.source_hash, i.status, i.product_count,
           i.variant_count, i.created_by, i.created_at, i.activated_at, i.payload_json
    FROM authority_catalog_publications p
    INNER JOIN authority_catalog_imports i ON i.id = p.import_id
    WHERE p.status = 'active'
    LIMIT 1
  `).get() as CatalogImportRow | undefined;

  if (!row) {
    return {
      ready: false,
      importId: null,
      productCount: 0,
      variantCount: 0,
      blockers: ["active_catalog_publication_missing"],
    };
  }

  return evaluateCatalogImportReadiness(parseImportRow(row), row.id);
}

export function getCatalogAuthoritySnapshot() {
  const imports = getAuthorityDatabase().prepare(`
    SELECT id, source_ref, source_hash, status, product_count, variant_count,
           created_by, created_at, activated_at, payload_json
    FROM authority_catalog_imports
    ORDER BY created_at DESC
    LIMIT 20
  `).all() as CatalogImportRow[];

  return {
    readiness: getCatalogAuthorityReadiness(),
    imports: imports.map((row) => ({
      id: row.id,
      sourceRef: row.source_ref,
      sourceHash: row.source_hash,
      status: row.status,
      productCount: row.product_count,
      variantCount: row.variant_count,
      createdBy: row.created_by,
      createdAt: row.created_at,
      activatedAt: row.activated_at,
      readiness: evaluateCatalogImportReadiness(parseImportRow(row), row.id),
    })),
  };
}

export function getActiveCatalogAuthority() {
  const row = getAuthorityDatabase().prepare(`
    SELECT i.id, i.source_ref, i.source_hash, i.status, i.product_count,
           i.variant_count, i.created_by, i.created_at, i.activated_at, i.payload_json
    FROM authority_catalog_publications p
    INNER JOIN authority_catalog_imports i ON i.id = p.import_id
    WHERE p.status = 'active'
    LIMIT 1
  `).get() as CatalogImportRow | undefined;

  if (!row) return null;
  return {
    importId: row.id,
    sourceHash: row.source_hash,
    payload: parseImportRow(row),
  };
}
