import Logger from "electron-log";
import { readQueue, writeQueue, SyncJob } from "./db.js";
import { isOnline } from "./connectivity.js";

const PROCESSOR_INTERVAL_MS = 15_000; // 15 seconds

/**
 * Build the fetch options for a given job.
 * Add new entity/operation cases here as the sync workflow grows.
 */
function buildRequest(job: SyncJob): { url: string; init: RequestInit } | null {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    const secret = process.env.DRIVER_SYNC_SECRET || "";
    const authHeader = { "Authorization": `Bearer ${secret}` };
    const payload = JSON.parse(job.payload);

    switch (job.entity) {
        case "category":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/categories/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/categories/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "subcategory":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/subcategories/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/subcategories/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "product":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/products/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/products/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "variant":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/variants/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/variants/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "variantitem":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/variants/items/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/variants/items/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "productvariant":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/variants/products-associations/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/variants/products-associations/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "printerproduct":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/printers-products/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/printers-products/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "group":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/groups/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/groups/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "groupitem":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/groups/items/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/groups/items/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "productgroup":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/groups/products-associations/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/groups/products-associations/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "menu":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/menus/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/menus/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "menupage":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/menus/pages/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/menus/pages/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "menupageproduct":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/menus/page-products/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/menus/page-products/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "menupageassociation":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/menu/menus/page-associations/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            if (job.operation === "delete") {
                return {
                    url: `${vpsUrl}/api/v1/menu/menus/page-associations/${payload.id}`,
                    init: { method: "DELETE", headers: authHeader },
                };
            }
            break;

        case "orderstatus":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/orders/${payload.id}/status`,
                    init: {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    },
                };
            }
            break;

        case "configuration":
            if (job.operation === "upsert") {
                return {
                    url: `${vpsUrl}/api/v1/configurations/sync`,
                    init: {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader },
                        body: JSON.stringify(payload),
                    },
                };
            }
            break;

        // ── Add more entities here in the future ──────────────────────────
    }

    // Unknown entity/operation — drop the job so it doesn't block the queue
    Logger.warn(`SyncQueue: unknown entity/operation — ${job.entity}:${job.operation} — dropping job ${job.id}`);
    return null;
}

/**
 * Attempt every pending job in the queue.
 * - Success        → remove from queue
 * - Network error  → keep in queue, increment attempts, retry next tick
 * - Unknown job    → drop (bad data, would never succeed)
 */
export async function processQueue(): Promise<void> {
    const jobs = readQueue();
    if (jobs.length === 0) return;

    Logger.info(`SyncQueue: processing ${jobs.length} pending job(s)...`);

    const remaining: SyncJob[] = [];
    let succeeded = 0;

    for (const job of jobs) {
        const request = buildRequest(job);

        // Unknown entity — drop and move on
        if (!request) continue;

        try {
            const response = await fetch(request.url, request.init);

            if (response.ok) {
                Logger.info(`SyncQueue: job ${job.id} (${job.entity}:${job.operation}) succeeded after ${job.attempts + 1} attempt(s)`);
                succeeded++;
                // Not pushed to remaining — job is done
            } else {
                Logger.warn(`SyncQueue: job ${job.id} attempt ${job.attempts + 1} failed — HTTP ${response.status} — will retry`);
                remaining.push({
                    ...job,
                    attempts: job.attempts + 1,
                    lastAttemptAt: new Date().toISOString(),
                });
            }
        } catch (err) {
            Logger.warn(`SyncQueue: job ${job.id} attempt ${job.attempts + 1} failed — ${String(err)} — will retry`);
            remaining.push({
                ...job,
                attempts: job.attempts + 1,
                lastAttemptAt: new Date().toISOString(),
            });
        }
    }

    writeQueue(remaining);
    Logger.info(`SyncQueue: done — ${succeeded} completed, ${remaining.length} still pending`);
}

/**
 * Start the background processor loop.
 * Called once from main/database/index.ts after the DB is ready.
 */
export function startQueueProcessor(): void {
    Logger.info(`SyncQueue: processor started (interval ${PROCESSOR_INTERVAL_MS / 1000}s)`);

    setInterval(async () => {
        try {
            const online = await isOnline();
            if (!online) {
                Logger.info("SyncQueue: offline — skipping this tick");
                return;
            }
            await processQueue();
        } catch (err) {
            Logger.error("SyncQueue: processor tick error:", err);
        }
    }, PROCESSOR_INTERVAL_MS);
}
