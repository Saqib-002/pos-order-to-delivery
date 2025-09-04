import { BrowserWindow } from "electron";
import { localDb, remoteDb } from "./index.js";
import Logger from "electron-log";
import { EventEmitter } from "events";

export class SyncManager extends EventEmitter {
    private syncInProgress = false;
    private retryCount = 0;
    private maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || "3");

    async syncWithRemote(): Promise<void> {
        if (!remoteDb || this.syncInProgress) return;

        this.syncInProgress = true;
        try {
            Logger.info("Starting database synchronization...");
            // Sync in transaction for consistency
            await localDb.transaction(async (trx) => {
                await this.syncTable("users", trx);
                await this.syncTable("orders", trx);
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
        const syncMeta = await db("sync_metadata")
            .where("table_name", tableName)
            .first();
        let lastSync;
        if (!syncMeta) {
            const remoteSyncMeta = await remoteDb!("sync_metadata")
                .where("table_name", tableName)
                .first();
            if (remoteSyncMeta) {
                lastSync = new Date(remoteSyncMeta.last_sync);
            } else {
                lastSync = new Date(0);
            }
        } else {
            lastSync = new Date(syncMeta.last_sync);
        }

        // 1. Pull remote changes
        const remoteChanges = await remoteDb!(tableName)
            .where("updatedAt", ">", lastSync)
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
                const remoteTime = new Date(remoteRecord.updated_at);
                const localTime = new Date(localRecord.updated_at);

                if (remoteTime > localTime) {
                    const oldRecord = { ...localRecord };
                    await db(tableName)
                        .where("id", remoteRecord.id)
                        .update({
                            ...remoteRecord,
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
                }
            }
        }

        // 2. Push local changes
        const localChanges = await db(tableName)
            .where("updatedAt", ">", lastSync)
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
                    // Update existing record
                    await remoteDb!(tableName)
                        .where("id", localRecord.id)
                        .update({
                            ...recordData,
                            syncedAt: new Date().toISOString(),
                        });
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
        const currentRevision = (syncMeta?.last_sync_revision || 0) + 1;

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
}
export const syncManager = new SyncManager();
