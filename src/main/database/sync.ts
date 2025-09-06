import { BrowserWindow } from "electron";
import { localDb, remoteDb } from "./index.js";
import Logger from "electron-log";
import { EventEmitter } from "events";

export class SyncManager extends EventEmitter {
    private syncInProgress = false;
    private retryCount = 0;
    private maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || "3");
    private syncInterval: NodeJS.Timeout | null = null;
    private syncIntervalMs = parseInt(process.env.SYNC_INTERVAL_MS || "30000");
    constructor() {
        super();
        this.startPeriodicSync();
    }
    // Start periodic sync
    startPeriodicSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            if (remoteDb && !this.syncInProgress) {
                Logger.info("Periodic sync triggered");
                await this.syncWithRemote();
            }
        }, this.syncIntervalMs);

        Logger.info(
            `Periodic sync started with interval: ${this.syncIntervalMs}ms`
        );
    }

    // Stop periodic sync
    stopPeriodicSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            Logger.info("Periodic sync stopped");
        }
    }

    async syncWithRemote(): Promise<void> {
        if (!remoteDb || this.syncInProgress) return;

        this.syncInProgress = true;
        try {
            Logger.info("Starting database synchronization...");
            // Sync in transaction for consistency
            await localDb.transaction(async (trx) => {
                await this.syncTable("users", trx);
                await this.syncTable("orders", trx);
                await this.syncTable("menu_items", trx);
                await this.syncTable("order_items", trx);
                await this.syncTable("delivery_persons", trx);
                await this.syncSyncMetadata(trx);
            });

            this.retryCount = 0;
            this.emit("sync-success");
            Logger.info("Database synchronization completed");
        } catch (error) {
            this.retryCount++;
            Logger.error(
                `Sync failed (attempt ${this.retryCount}/${this.maxRetries}):`,
                error
            );

            if (this.retryCount < this.maxRetries) {
                const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
                setTimeout(() => this.syncWithRemote(), delay);
            } else {
                this.emit("sync-failed", error);
                this.retryCount = 0;
            }
        } finally {
            this.syncInProgress = false;
        }
    }

    private async syncTable(tableName: string, trx?: any): Promise<void> {
        const db = trx || localDb;
        const localSyncMeta = await db("sync_metadata")
            .where("table_name", tableName)
            .first();
        const remoteSyncMeta = await remoteDb!("sync_metadata")
            .where("table_name", tableName)
            .first();
        let lastSync = new Date(0);
        if (localSyncMeta && remoteSyncMeta) {
            const localTime = new Date(localSyncMeta.last_sync);
            const remoteTime = new Date(remoteSyncMeta.last_sync);
            lastSync = localTime < remoteTime ? localTime : remoteTime;
        } else if (localSyncMeta) {
            lastSync = new Date(localSyncMeta.last_sync);
        } else if (remoteSyncMeta) {
            lastSync = new Date(remoteSyncMeta.last_sync);
        }

        // 1. Pull remote changes
        const remoteChanges = await remoteDb!(tableName)
            .where("updatedAt", ">", lastSync.toISOString())
            .orderBy("updatedAt", "asc");

        Logger.info(
            `Pulling ${remoteChanges.length} remote changes for ${tableName}`
        );

        for (const remoteRecord of remoteChanges) {
            const localRecord = await db(tableName)
                .where("id", remoteRecord.id)
                .first();

            if (!localRecord) {
                // Insert new record
                await db(tableName).insert({
                    ...remoteRecord,
                    syncedAt: new Date().toISOString(),
                });
                // Emit change event for orders table only
                if (tableName === "orders") {
                    this.emitOrderChange({
                        type: "insert",
                        id: remoteRecord.id,
                        doc: this.formatOrderForFrontend(remoteRecord),
                        source: "remote",
                    });
                }
            } else {
                // Resolve conflict - last write wins
                const remoteTime = new Date(remoteRecord.updatedAt);
                const localTime = new Date(localRecord.updatedAt);
                console.log({ remoteTime, localTime });
                if (remoteTime > localTime) {
                    const oldRecord = { ...localRecord };
                    console.log("Syncing remote record:", remoteRecord);
                    await db(tableName)
                        .where("id", remoteRecord.id)
                        .update({
                            ...remoteRecord,
                            items: typeof remoteRecord.items !== "string"
                                ? JSON.stringify(remoteRecord.items)
                                : remoteRecord.items,
                            syncedAt: new Date().toISOString(),
                        });
                    // Emit change event for orders table only
                    if (tableName === "orders") {
                        this.emitOrderChange({
                            type: "update",
                            id: remoteRecord.id,
                            doc: this.formatOrderForFrontend(remoteRecord),
                            oldDoc: this.formatOrderForFrontend(oldRecord),
                            source: "remote",
                        });
                    }
                } else {
                    // Same timestamp, check if content differs
                    const {
                        syncedAt: localSynced,
                        updatedAt: localUpdated,
                        ...localContent
                    } = localRecord;
                    const {
                        syncedAt: remoteSynced,
                        updatedAt: remoteUpdated,
                        ...remoteContent
                    } = remoteRecord;

                    if (
                        JSON.stringify(localContent) !==
                        JSON.stringify(remoteContent)
                    ) {
                        // Content differs but timestamps are same, log conflict
                        Logger.warn(
                            `Conflict detected for ${tableName} record ${remoteRecord.id} - same timestamp but different content`
                        );
                        // Apply remote changes (last write wins default)
                        await db(tableName)
                            .where("id", remoteRecord.id)
                            .update({
                                ...remoteRecord,
                                syncedAt: new Date().toISOString(),
                            });
                    }
                }
            }
        }

        // 2. Push local changes
        const localChanges = await db(tableName)
            .where("updatedAt", ">", lastSync.toISOString())
            .whereNull("syncedAt");

        Logger.info(
            `Pushing ${localChanges.length} local changes for ${tableName}`
        );

        for (const localRecord of localChanges) {
            const { syncedAt, ...recordData } = localRecord;

            try {
                const existingRemote = await remoteDb!(tableName)
                    .where("id", localRecord.id)
                    .first();
                if (existingRemote) {
                    const remoteTime = new Date(existingRemote.updatedAt);
                    const localTime = new Date(localRecord.updatedAt);
                    if (remoteTime >= localTime) {
                        // Update existing record
                        await remoteDb!(tableName)
                            .where("id", localRecord.id)
                            .update({
                                ...recordData,
                                syncedAt: new Date().toISOString(),
                            });
                    }
                } else {
                    // Insert new record
                    await remoteDb!(tableName).insert({
                        ...recordData,
                        syncedAt: new Date().toISOString(),
                    });
                }
            } catch (error) {
                Logger.error(`Failed to sync record ${localRecord.id}:`, error);
            }
        }
        // 3. Update sync metadata
        const currentTime = new Date().toISOString();
        const currentRevision =
            Math.max(
                localSyncMeta?.last_sync_revision || 0,
                remoteSyncMeta?.last_sync_revision || 0
            ) + 1;

        await db("sync_metadata")
            .insert({
                table_name: tableName,
                last_sync: currentTime,
                last_sync_revision: currentRevision,
                created_at: currentTime,
                updated_at: currentTime,
            })
            .onConflict("table_name")
            .merge({
                last_sync: currentTime,
                last_sync_revision: currentRevision,
                updated_at: currentTime,
            });
        await remoteDb!("sync_metadata")
            .insert({
                table_name: tableName,
                last_sync: currentTime,
                last_sync_revision: currentRevision,
                created_at: currentTime,
                updated_at: currentTime,
            })
            .onConflict("table_name")
            .merge({
                last_sync: currentTime,
                last_sync_revision: currentRevision,
                updated_at: currentTime,
            });
    }
    private async syncSyncMetadata(trx?: any): Promise<void> {
        const db = trx || localDb;

        try {
            // Get all remote metadata
            const remoteMetadata = await remoteDb!("sync_metadata").select("*");

            for (const remoteMeta of remoteMetadata) {
                const localMeta = await db("sync_metadata")
                    .where("table_name", remoteMeta.table_name)
                    .first();

                if (!localMeta) {
                    // Insert missing metadata
                    await db("sync_metadata").insert(remoteMeta);
                    Logger.info(
                        `Inserted missing sync metadata for ${remoteMeta.table_name}`
                    );
                } else {
                    // Update if remote is newer
                    const remoteTime = new Date(remoteMeta.updated_at);
                    const localTime = new Date(localMeta.updated_at);

                    if (remoteTime > localTime) {
                        await db("sync_metadata")
                            .where("table_name", remoteMeta.table_name)
                            .update(remoteMeta);
                        Logger.info(
                            `Updated sync metadata for ${remoteMeta.table_name}`
                        );
                    }
                }
            }

            // Push local metadata to remote
            const localMetadata = await db("sync_metadata").select("*");

            for (const localMeta of localMetadata) {
                const remoteMeta = await remoteDb!("sync_metadata")
                    .where("table_name", localMeta.table_name)
                    .first();

                if (!remoteMeta) {
                    // Insert to remote
                    await remoteDb!("sync_metadata").insert(localMeta);
                    Logger.info(
                        `Pushed sync metadata for ${localMeta.table_name} to remote`
                    );
                } else {
                    // Update remote if local is newer
                    const localTime = new Date(localMeta.updated_at);
                    const remoteTime = new Date(remoteMeta.updated_at);

                    if (localTime > remoteTime) {
                        await remoteDb!("sync_metadata")
                            .where("table_name", localMeta.table_name)
                            .update(localMeta);
                        Logger.info(
                            `Updated remote sync metadata for ${localMeta.table_name}`
                        );
                    }
                }
            }
        } catch (error) {
            Logger.error("Failed to sync metadata table:", error);
        }
    }
    // Helper method to format order record for frontend
    private formatOrderForFrontend(record: any): any {
        if (!record) return null;

        return {
            id: record.id,
            orderId: record.orderId,
            customer: {
                name: record.customerName,
                phone: record.customerPhone,
                address: record.customerAddress,
            },
            items:
                typeof record.items === "string"
                    ? JSON.parse(record.items)
                    : record.items,
            status: record.status,
            deliveryPerson: record.deliveryPerson,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            isDeleted: record.isDeleted || false,
        };
    }
    async forceSyncTable(tableName: string): Promise<void> {
        if (!remoteDb) throw new Error("Remote database not available");

        await this.syncTable(tableName);
    }
    private emitOrderChange(change: {
        type: "insert" | "update" | "delete";
        id: string;
        doc?: any;
        oldDoc?: any;
        source: "local" | "remote";
    }): void {
        // Send to all renderer processes
        BrowserWindow.getAllWindows().forEach((win) => {
            if (!win.isDestroyed()) {
                win.webContents.send("order-change", {
                    ...change,
                    timestamp: new Date().toISOString(),
                });
            }
        });

        Logger.info(
            `Order change emitted: ${change.type} for order ${change.id}`
        );
    }
    // Method to manually emit order changes (for local operations)
    emitLocalOrderChange(change: {
        type: "insert" | "update" | "delete";
        id: string;
        doc?: any;
        oldDoc?: any;
    }): void {
        this.emitOrderChange({
            ...change,
            source: "local",
        });
    }

    getSyncStatus(): {
        inProgress: boolean;
        lastSync: Date;
        retryCount: number;
    } {
        return {
            inProgress: this.syncInProgress,
            lastSync: new Date(), // TODO: Get from metadata
            retryCount: this.retryCount,
        };
    }
    destroy(): void {
        this.stopPeriodicSync();
        this.removeAllListeners();
        Logger.info("SyncManager destroyed");
    }
}
export const syncManager = new SyncManager();
