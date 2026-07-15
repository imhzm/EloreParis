import "server-only";

import type { DatabaseSync } from "node:sqlite";
import {
  getAuthorityDatabase,
  runAuthorityTransaction,
} from "@/lib/authority-database";
import { sanitizeStoredOrders } from "@/lib/orders";

type ReservationState = "active" | "committed" | "released" | "expired";

type ReservationRow = {
  id: string;
  catalog_import_id: string;
  sku: string;
  location_id: string;
  quantity: number;
  state: ReservationState;
};

export class InventoryReservationError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 409, code = "reservation_conflict") {
    super(message);
    this.name = "InventoryReservationError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function readOrderReservations(database: DatabaseSync, orderNumber: string) {
  return database.prepare(`
    SELECT id, catalog_import_id, sku, location_id, quantity, state
    FROM authority_inventory_reservations
    WHERE order_number = ?
    ORDER BY sku
  `).all(orderNumber) as ReservationRow[];
}

function assertConsistentTerminalState(rows: ReservationRow[]) {
  const states = new Set(rows.map((row) => row.state));
  if (states.size > 1 && states.has("active")) {
    throw new InventoryReservationError(
      "The order reservation set contains an inconsistent partial transition.",
      500,
      "reservation_integrity_error",
    );
  }
}

export function commitAuthorityInventoryReservations(
  database: DatabaseSync,
  orderNumber: string,
  reason: string,
) {
  const rows = readOrderReservations(database, orderNumber);
  if (rows.length === 0) return { transitioned: 0, replayed: true };

  assertConsistentTerminalState(rows);
  if (rows.every((row) => row.state === "committed")) {
    return { transitioned: 0, replayed: true };
  }
  if (rows.some((row) => row.state === "released" || row.state === "expired")) {
    throw new InventoryReservationError(
      "Inventory reservations were already released and cannot be committed.",
      409,
      "reservation_unavailable",
    );
  }

  const now = new Date().toISOString();
  const updateBalance = database.prepare(`
    UPDATE authority_inventory_balances
    SET on_hand = on_hand - ?, reserved = reserved - ?,
        version = version + 1, updated_at = ?
    WHERE import_id = ? AND sku = ? AND location_id = ?
      AND on_hand >= ? AND reserved >= ?
  `);
  const updateReservation = database.prepare(`
    UPDATE authority_inventory_reservations
    SET state = 'committed', terminal_reason = ?, terminal_at = ?, updated_at = ?
    WHERE id = ? AND state = 'active'
  `);

  for (const row of rows) {
    const balanceResult = updateBalance.run(
      row.quantity,
      row.quantity,
      now,
      row.catalog_import_id,
      row.sku,
      row.location_id,
      row.quantity,
      row.quantity,
    ) as { changes: number | bigint };
    if (Number(balanceResult.changes) !== 1) {
      throw new InventoryReservationError(
        `Inventory balance could not commit reservation for ${row.sku}.`,
        409,
        "reservation_commit_failed",
      );
    }

    const reservationResult = updateReservation.run(reason, now, now, row.id) as {
      changes: number | bigint;
    };
    if (Number(reservationResult.changes) !== 1) {
      throw new InventoryReservationError(
        `Reservation state changed while committing ${row.sku}.`,
        409,
        "reservation_concurrent_update",
      );
    }
  }

  return { transitioned: rows.length, replayed: false };
}

export function releaseAuthorityInventoryReservations(
  database: DatabaseSync,
  orderNumber: string,
  state: "released" | "expired",
  reason: string,
) {
  const rows = readOrderReservations(database, orderNumber);
  if (rows.length === 0) return { transitioned: 0, replayed: true };

  assertConsistentTerminalState(rows);
  if (rows.every((row) => row.state === state)) {
    return { transitioned: 0, replayed: true };
  }
  if (rows.some((row) => row.state === "committed")) {
    throw new InventoryReservationError(
      "Committed inventory cannot be released without an explicit restock flow.",
      409,
      "reservation_already_committed",
    );
  }

  const now = new Date().toISOString();
  const updateBalance = database.prepare(`
    UPDATE authority_inventory_balances
    SET reserved = reserved - ?, version = version + 1, updated_at = ?
    WHERE import_id = ? AND sku = ? AND location_id = ? AND reserved >= ?
  `);
  const updateReservation = database.prepare(`
    UPDATE authority_inventory_reservations
    SET state = ?, terminal_reason = ?, terminal_at = ?, updated_at = ?
    WHERE id = ? AND state = 'active'
  `);

  for (const row of rows) {
    const balanceResult = updateBalance.run(
      row.quantity,
      now,
      row.catalog_import_id,
      row.sku,
      row.location_id,
      row.quantity,
    ) as { changes: number | bigint };
    if (Number(balanceResult.changes) !== 1) {
      throw new InventoryReservationError(
        `Inventory balance could not release reservation for ${row.sku}.`,
        409,
        "reservation_release_failed",
      );
    }

    const reservationResult = updateReservation.run(
      state,
      reason,
      now,
      now,
      row.id,
    ) as { changes: number | bigint };
    if (Number(reservationResult.changes) !== 1) {
      throw new InventoryReservationError(
        `Reservation state changed while releasing ${row.sku}.`,
        409,
        "reservation_concurrent_update",
      );
    }
  }

  return { transitioned: rows.length, replayed: false };
}

export function commitAuthorityOrderInventory(orderNumber: string, reason: string) {
  return runAuthorityTransaction((database) =>
    commitAuthorityInventoryReservations(database, orderNumber, reason),
  );
}

export function releaseAuthorityOrderInventory(
  orderNumber: string,
  state: "released" | "expired",
  reason: string,
) {
  return runAuthorityTransaction((database) =>
    releaseAuthorityInventoryReservations(database, orderNumber, state, reason),
  );
}

export function expireDueAuthorityInventoryReservations({
  now = new Date(),
  limit = 50,
}: {
  now?: Date;
  limit?: number;
} = {}) {
  const normalizedLimit = Math.min(Math.max(Math.floor(limit), 1), 200);
  const nowIso = now.toISOString();
  const dueOrders = getAuthorityDatabase().prepare(`
    SELECT DISTINCT reservations.order_number
    FROM authority_inventory_reservations AS reservations
    INNER JOIN authority_orders AS orders
      ON orders.order_number = reservations.order_number
    WHERE reservations.state = 'active'
      AND reservations.expires_at <= ?
      AND orders.status = 'payment_pending'
    ORDER BY reservations.expires_at, reservations.order_number
    LIMIT ?
  `).all(nowIso, normalizedLimit) as Array<{ order_number: string }>;

  let expired = 0;
  for (const candidate of dueOrders) {
    const changed = runAuthorityTransaction((database) => {
      const row = database.prepare(`
        SELECT status, payload_json
        FROM authority_orders
        WHERE order_number = ?
      `).get(candidate.order_number) as
        | { status: string; payload_json: string }
        | undefined;
      if (!row || row.status !== "payment_pending") return false;

      const order = sanitizeStoredOrders([JSON.parse(row.payload_json)])[0];
      if (!order) {
        throw new InventoryReservationError(
          "The expired reservation points to an unreadable order.",
          500,
          "reservation_order_invalid",
        );
      }
      releaseAuthorityInventoryReservations(
        database,
        order.orderNumber,
        "expired",
        "payment_reservation_expired",
      );
      const expiredOrder = { ...order, status: "payment_expired" as const };
      const result = database.prepare(`
        UPDATE authority_orders
        SET status = 'payment_expired', payload_json = ?, updated_at = ?,
            revision = revision + 1
        WHERE order_number = ? AND status = 'payment_pending'
      `).run(JSON.stringify(expiredOrder), nowIso, order.orderNumber) as {
        changes: number | bigint;
      };
      if (Number(result.changes) !== 1) {
        throw new InventoryReservationError(
          "The payment order changed while expiring its reservation.",
          409,
          "reservation_concurrent_update",
        );
      }
      return true;
    });
    if (changed) expired += 1;
  }

  return { inspected: dueOrders.length, expired };
}
