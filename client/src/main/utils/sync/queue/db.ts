import Store from "electron-store";

/**
 * Shape of a single pending sync job stored in electron-store.
 */
export interface SyncJob {
  id: string;               // uuid — unique per job
  entity: string;           // "category" | "subcategory" — extensible
  operation: string;        // "upsert" | "delete"
  payload: string;          // JSON-serialised data
  attempts: number;         // how many times we have tried
  lastAttemptAt: string | null;
  createdAt: string;
}

/**
 * Key used inside electron-store for the queue array.
 */
export const QUEUE_KEY = "syncQueue";

/**
 * Shared electron-store instance for the sync queue.
 * We keep it separate from every other Store instance so the queue
 * key never collides with app settings (cdnUrl, language, etc.).
 */
export const queueStore = new Store({ name: "sync-queue" }) as any;

/**
 * Return all pending jobs from the store.
 */
export function readQueue(): SyncJob[] {
    return queueStore.get(QUEUE_KEY, []) as SyncJob[];
}

/**
 * Persist the full queue array back to the store.
 */
export function writeQueue(jobs: SyncJob[]): void {
    queueStore.set(QUEUE_KEY, jobs);
}
