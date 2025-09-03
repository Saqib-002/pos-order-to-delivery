import { localDb, remoteDb } from './index.js';
import Logger from 'electron-log';
import { EventEmitter } from 'events';

export class SyncManager extends EventEmitter {
  private syncInProgress = false;
  private retryCount = 0;
  private maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || '3');
  
  async syncWithRemote(): Promise<void> {
    if (!remoteDb || this.syncInProgress) return;

    this.syncInProgress = true;
    try {
      Logger.info('Starting database synchronization...');
      // Sync in transaction for consistency
      await localDb.transaction(async (trx) => {
        await this.syncTable('users', trx);
        await this.syncTable('orders', trx);
      });

      this.retryCount = 0;
      this.emit('sync-success');
      Logger.info('Database synchronization completed');
      
    } catch (error) {
      this.retryCount++;
      Logger.error(`Sync failed (attempt ${this.retryCount}/${this.maxRetries}):`, error);
      
      if (this.retryCount < this.maxRetries) {
        const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
        setTimeout(() => this.syncWithRemote(), delay);
      } else {
        this.emit('sync-failed', error);
        this.retryCount = 0;
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncTable(tableName: string, trx?: any): Promise<void> {
    const db = trx || localDb;
    const syncMeta = await db('sync_metadata').where('table_name', tableName).first();
    let lastSync;
    if(!syncMeta){
      const remoteSyncMeta = await remoteDb!('sync_metadata').where('table_name', tableName).first();
      if(remoteSyncMeta){
        lastSync = new Date(remoteSyncMeta.last_sync);
      }else{
        lastSync = new Date(0);
      }
    }else{
      lastSync = new Date(syncMeta.last_sync);
    }

    // 1. Pull remote changes
    const remoteChanges = await remoteDb!(tableName)
      .where('updatedAt', '>', lastSync)
      .orderBy('updatedAt', 'asc');

    Logger.info(`Pulling ${remoteChanges.length} remote changes for ${tableName}`);

    for (const remoteRecord of remoteChanges) {
      const localRecord = await db(tableName).where('id', remoteRecord.id).first();
      
      if (!localRecord) {
        // Insert new record
        await db(tableName).insert({
          ...remoteRecord,
          syncedAt: new Date().toISOString()
        });
      } else {
        // Resolve conflict - last write wins
        const remoteTime = new Date(remoteRecord.updated_at);
        const localTime = new Date(localRecord.updated_at);
        
        if (remoteTime > localTime) {
          await db(tableName)
            .where('id', remoteRecord.id)
            .update({
              ...remoteRecord,
              syncedAt: new Date().toISOString()
            });
        }
      }
    }

    // 2. Push local changes
    const localChanges = await db(tableName)
      .where('updatedAt', '>', lastSync)
      .whereNull('syncedAt');

    Logger.info(`Pushing ${localChanges.length} local changes for ${tableName}`);

    for (const localRecord of localChanges) {
      const { synced_at, ...recordData } = localRecord;
      
      try {
        await remoteDb!(tableName)
          .insert(recordData)
          .onConflict('id')
          .merge();
        
        // Mark as synced
        await db(tableName)
          .where('id', localRecord.id)
          .update({ syncedAt: new Date().toISOString() });
          
      } catch (error) {
        Logger.error(`Failed to sync record ${localRecord.id}:`, error);
      }
    }

    // 3. Update sync metadata
    await db('sync_metadata')
      .where('table_name', tableName)
      .update({ 
        last_sync: new Date().toISOString(),
        last_sync_revision: syncMeta?.last_sync_revision + 1  || 0
      });
  }

  async forceSyncTable(tableName: string): Promise<void> {
    if (!remoteDb) throw new Error('Remote database not available');
    
    await this.syncTable(tableName);
  }

  getSyncStatus(): { inProgress: boolean; lastSync: Date; retryCount: number } {
    return {
      inProgress: this.syncInProgress,
      lastSync: new Date(), // TODO: Get from metadata
      retryCount: this.retryCount
    };
  }
}
export const syncManager = new SyncManager();