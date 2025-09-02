import knex, { Knex } from 'knex';
import knexConfig from '../../../knexfile';
import Logger from 'electron-log';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export let localDb: Knex;
export let remoteDb: Knex | null = null;

export async function initDatabase(): Promise<void> {
  try {
    // Ensure data directory exists
    const userDataPath = app.getPath('userData');
    const dataDir = path.dirname(knexConfig.development.connection.filename);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize local SQLite database
    localDb = knex(knexConfig.development);
    Logger.info('Local SQLite database initialized');

    // Run migrations for local database
    await localDb.migrate.latest();
    Logger.info('Local database migrations completed');

    // Initialize sync metadata
    await initSyncMetadata();

    // Try to connect to remote PostgreSQL
    await connectToRemoteDb();

    // Start sync process if remote connection successful
    if (remoteDb) {
      startSyncProcess();
    }

  } catch (error) {
    Logger.error('Database initialization error:', error);
    throw error;
  }
}

async function connectToRemoteDb(): Promise<void> {
  try {
    if (!process.env.PG_HOST) {
      Logger.warn('No PostgreSQL configuration found, using local database only');
      return;
    }

    remoteDb = knex(knexConfig.production);
    
    // Test connection
    await remoteDb.raw('SELECT 1');
    Logger.info('Remote PostgreSQL connection successful');

    // Run migrations for remote database
    await remoteDb.migrate.latest();
    Logger.info('Remote database migrations completed');

  } catch (error :any) {
    Logger.error('Remote PostgreSQL connection failed, using local database only:', error.message);
    remoteDb = null;
  }
}

async function initSyncMetadata(): Promise<void> {
  const tables = ['users', 'orders'];
  
  for (const tableName of tables) {
    const exists = await localDb('sync_metadata').where('table_name', tableName).first();
    if (!exists) {
      await localDb('sync_metadata').insert({
        table_name: tableName,
        last_sync: new Date().toISOString(),
        last_sync_revision: 0,
        sync_config: JSON.stringify({ enabled: true })
      });
    }
  }
}

function startSyncProcess(): void {
  // Sync every 30 seconds
  setInterval(async () => {
    try {
      await syncWithRemote();
    } catch (error) {
      Logger.error('Sync error:', error);
    }
  }, parseInt(process.env.SYNC_INTERVAL || '30000'));

  // Initial sync
  setTimeout(() => syncWithRemote(), 1000);
}

async function syncWithRemote(): Promise<void> {
  if (!remoteDb) return;

  try {
    Logger.info('Starting sync with remote database...');
    
    // Sync users
    await syncTable('users');
    
    // Sync orders
    await syncTable('orders');
    
    Logger.info('Sync completed successfully');
  } catch (error) {
    Logger.error('Sync failed:', error);
  }
}

async function syncTable(tableName: string): Promise<void> {
  if (!remoteDb) return;

  const syncMeta = await localDb('sync_metadata').where('table_name', tableName).first();
  const lastSync = new Date(syncMeta.last_sync);

  // Pull changes from remote
  const remoteChanges = await remoteDb(tableName)
    .where('updated_at', '>', lastSync)
    .andWhere('is_deleted', false);

  // Push local changes to remote
  const localChanges = await localDb(tableName)
    .where('updated_at', '>', lastSync)
    .whereNull('synced_at');

  // Apply remote changes locally
  for (const change of remoteChanges) {
    await localDb(tableName)
      .insert({
        ...change,
        synced_at: new Date().toISOString()
      })
      .onConflict('id')
      .merge(['customer_name', 'customer_phone', 'customer_address', 'items', 'status', 'delivery_person', 'updated_at', 'synced_at']);
  }

  // Apply local changes to remote
  for (const change of localChanges) {
    const { synced_at, ...changeData } = change;
    await remoteDb(tableName)
      .insert(changeData)
      .onConflict('id')
      .merge();
    
    // Mark as synced locally
    await localDb(tableName)
      .where('id', change.id)
      .update({ synced_at: new Date().toISOString() });
  }

  // Update sync metadata
  await localDb('sync_metadata')
    .where('table_name', tableName)
    .update({ last_sync: new Date().toISOString() });
}

export { syncWithRemote };