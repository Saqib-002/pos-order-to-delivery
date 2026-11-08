import { db } from "../../database/index.js";

// PostgreSQL advisory lock keys, shared by every POS connected to the same database.
export const ORDER_SYNC_QUEUE_LOCK = 742301;
export const WEB_ORDER_SYNC_LOCK = 742302;
export const DELIVERY_PERSON_SYNC_QUEUE_LOCK = 742303;
export const DRIVER_ORDER_SYNC_QUEUE_LOCK = 742304;
export const DRIVER_ORDER_STATUS_SYNC_LOCK = 742305;

/**
 * Run `fn` only if no other POS is running the same job right now.
 *
 * Uses a transaction-scoped PostgreSQL advisory lock: it is released as soon as
 * `fn` finishes or the connection drops, so a crashed or switched-off PC can
 * never leave it stuck. Protects against two PCs both acting as master.
 *
 * Returns false (without running `fn`) when another POS holds the lock.
 */
/**
 * Wait for an in-flight sync round to finish, but never longer than `maxMs`.
 * Used when stopping sync services, so the database pool isn't closed under a
 * running round (which could leave a sent update in the queue and resend it).
 */
export async function waitForRound(round: Promise<unknown> | null, maxMs = 20_000): Promise<void> {
  if (!round) return;
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, maxMs);
  });
  await Promise.race([round.catch(() => undefined), timeout]);
  if (timer) clearTimeout(timer);
}

export async function withSyncLock(key: number, fn: () => Promise<void>): Promise<boolean> {
  return db.transaction(async (trx) => {
    const result = await trx.raw("SELECT pg_try_advisory_xact_lock(?) AS locked", [key]);
    if (!result?.rows?.[0]?.locked) return false;
    await fn();
    return true;
  });
}
