import { enqueue } from "./queue/index.js";
import Logger from "electron-log";

/**
 * Enqueue site content key/value pair to sync to VPS v1 API.
 * Called whenever content is updated in the POS Web & App Admin module.
 */
export async function syncSiteContentToVPS(key: string, value: any): Promise<void> {
  try {
    enqueue("site_content", "upsert", {
      key,
      value,
    });
    Logger.info(`SyncQueue [site_content]: Queued sync for key '${key}'`);
  } catch (err) {
    Logger.error(`SyncQueue [site_content]: Error queuing content for key '${key}':`, err);
  }
}
