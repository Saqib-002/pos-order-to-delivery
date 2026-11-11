import { syncLogger as Logger } from "../../logger.js";
import { processDeliveryPersonSyncQueue, stopDeliveryPersonSyncQueue } from "../queue/deliveryPersonQueue.js";
import { processWebCustomerSync, stopWebCustomerSync } from "../webCustomer.js";

const SYNC_INTERVAL_MS = 120_000;

let syncInterval: NodeJS.Timeout | null = null;
let currentRound: Promise<void> | null = null;

async function runRound(label: string): Promise<void> {
  try {
    await Promise.all([
      processWebCustomerSync(),
      processDeliveryPersonSyncQueue(),
    ]);
  } catch (error) {
    Logger.error(`CustomerAndDeliveryPersonSync: ${label} round failed:`, error);
  }
}

function processRound(label: string): Promise<void> {
  if (currentRound) return currentRound;
  currentRound = runRound(label).finally(() => {
    currentRound = null;
  });
  return currentRound;
}

/** Run both syncs immediately, then on one shared two-minute interval. */
export function startCustomerAndDeliveryPersonSync(): void {
  if (syncInterval) return;
  Logger.info(`CustomerAndDeliveryPersonSync: started (every ${SYNC_INTERVAL_MS / 1000}s)`);

  void processRound("initial");
  syncInterval = setInterval(() => {
    void processRound("scheduled");
  }, SYNC_INTERVAL_MS);
}

/** Stop scheduling and wait for both current sync rounds to finish. */
export async function stopCustomerAndDeliveryPersonSync(): Promise<void> {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    Logger.info("CustomerAndDeliveryPersonSync: stopped");
  }

  await Promise.all([
    currentRound?.catch(() => undefined),
    stopWebCustomerSync(),
    stopDeliveryPersonSyncQueue(),
  ]);
}
