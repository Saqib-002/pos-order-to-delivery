import { randomUUID } from "crypto";
import { readQueue, writeQueue, SyncJob } from "./db.js";
import Logger from "electron-log";

/**
 * Add a new sync job to the persistent queue.
 * Returns immediately — the processor will handle the actual HTTP call.
 *
 * @param entity    - "category" | "subcategory" (extensible)
 * @param operation - "upsert" | "delete"
 * @param payload   - the data object to send (will be JSON-serialised)
 */
export function enqueue(entity: string, operation: string, payload: object): void {
    try {
        const jobs = readQueue();

        const job: SyncJob = {
            id: randomUUID(),
            entity,
            operation,
            payload: JSON.stringify(payload),
            attempts: 0,
            lastAttemptAt: null,
            createdAt: new Date().toISOString(),
        };

        jobs.push(job);
        writeQueue(jobs);

        Logger.info(`SyncQueue: enqueued ${entity}:${operation} — job ${job.id}`);
    } catch (err) {
        Logger.error("SyncQueue: failed to enqueue job:", err);
    }
}
