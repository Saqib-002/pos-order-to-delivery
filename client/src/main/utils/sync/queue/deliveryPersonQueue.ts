import os from "os";
import type { Knex } from "knex";
import { db } from "../../../database/index.js";
import { syncLogger as Logger } from "../../logger.js";
import { withSyncLock, waitForRound, DELIVERY_PERSON_SYNC_QUEUE_LOCK } from "../lock.js";

const TABLE = "delivery_person_sync_queue";
const BATCH_SIZE = 50;
const REQUEST_TIMEOUT_MS = 15_000;

type SyncableDeliveryPerson = {
  id: string;
  name: string;
  email?: string | null;
  username?: string | null;
  phone?: string | null;
  vehicleType?: string | null;
  licenseNo?: string | null;
  password?: string | null;
  isActive?: boolean | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

function toPayload(person: SyncableDeliveryPerson) {
  return {
    id: person.id,
    name: person.name,
    email: person.email ?? null,
    username: person.username ?? null,
    phone: person.phone ?? null,
    vehicleType: person.vehicleType ?? null,
    licenseNo: person.licenseNo ?? null,
    // This is the existing bcrypt hash, never the plaintext password.
    password: person.password ?? null,
    isActive: person.isActive ?? true,
    createdAt: person.createdAt ?? null,
    updatedAt: person.updatedAt ?? null,
  };
}

export async function enqueueDeliveryPersonUpsert(
  trx: Knex.Transaction,
  person: SyncableDeliveryPerson,
  options: { includePassword?: boolean } = {},
): Promise<void> {
  const payload = toPayload(person);
  if (!options.includePassword) delete (payload as Partial<typeof payload>).password;
  await trx(TABLE).insert({
    deliveryPersonId: person.id,
    operation: "upsert",
    payload: JSON.stringify(payload),
    deviceName: os.hostname(),
  });
}

export async function enqueueDeliveryPersonDelete(
  trx: Knex.Transaction,
  deliveryPersonId: string,
): Promise<void> {
  await trx(TABLE).insert({
    deliveryPersonId,
    operation: "delete",
    payload: JSON.stringify({ id: deliveryPersonId }),
    deviceName: os.hostname(),
  });
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 401 || status === 403 || status === 408 || status === 429;
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "";
  }
}

async function recordFailure(id: number, attempts: number, error: string, park: boolean): Promise<void> {
  await db(TABLE).where({ id }).update({
    attempts: attempts + 1,
    lastError: error.slice(0, 1000),
    lastAttemptAt: db.fn.now(),
    ...(park ? { parkedAt: db.fn.now() } : {}),
  });
}

async function sendPendingDeliveryPeople(): Promise<void> {
  const rows = await db(TABLE).whereNull("parkedAt").orderBy("id", "asc").limit(BATCH_SIZE);
  if (rows.length === 0) return;

  const serverUrl = (process.env.SERVER_API_URL || "http://localhost:3002").replace(/\/$/, "");
  const serverUrlSuffix = (process.env.SERVER_API_URL_SUFFIX || "http://localhost:3002").replace(/\/$/, "");
  const secret = process.env.SERVER_SYNC_SECRET || "";
  let sent = 0;

  for (const row of rows) {
    const label = `#${row.id} delivery person ${row.deliveryPersonId}`;
    // Rows queued by earlier app versions used "deactivate" for explicit
    // deletes; treat those legacy records as hard-delete requests too.
    const isDelete = row.operation === "delete" || row.operation === "deactivate";
    const endpoint = isDelete
      ? `${serverUrl}/${serverUrlSuffix}/driver/pos/delivery-persons/${encodeURIComponent(row.deliveryPersonId)}/deactivate`
      : `${serverUrl}/${serverUrlSuffix}/driver/pos/delivery-persons/sync`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: isDelete ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: row.payload,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      await recordFailure(row.id, row.attempts, String(err), false);
      Logger.warn(`DeliveryPersonSyncQueue: ${label} not sent (${String(err)}), will retry`);
      break;
    }

    if (response.ok) {
      await db(TABLE).where({ id: row.id }).delete();
      sent++;
      continue;
    }

    const error = `HTTP ${response.status} ${await readErrorBody(response)}`.trim();
    if (isRetryableStatus(response.status)) {
      await recordFailure(row.id, row.attempts, error, false);
      Logger.warn(`DeliveryPersonSyncQueue: ${label} not sent (${error}), will retry`);
      break;
    }

    await recordFailure(row.id, row.attempts, error, true);
    Logger.error(`DeliveryPersonSyncQueue: ${label} rejected and parked (${error})`);
  }

  if (sent > 0) Logger.info(`DeliveryPersonSyncQueue: sent ${sent} change(s)`);
}

let currentRound: Promise<void> | null = null;

export async function processDeliveryPersonSyncQueue(): Promise<void> {
  if (currentRound) return;
  currentRound = withSyncLock(DELIVERY_PERSON_SYNC_QUEUE_LOCK, sendPendingDeliveryPeople)
    .then(() => undefined)
    .finally(() => { currentRound = null; });
  await currentRound;
}

export async function stopDeliveryPersonSyncQueue(): Promise<void> {
  await waitForRound(currentRound);
}
