import knex, { Knex } from 'knex';
import knexConfig from '../../knexfile.js';
import Logger from 'electron-log';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { syncManager } from './sync.js';

dotenv.config();
export let localDb: Knex;
export let remoteDb: Knex | null = null;

export async function initDatabase(): Promise<void> {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(knexConfig.development.connection.filename);
    console.log('Data directory:', dataDir);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize local SQLite database
    localDb = knex(knexConfig.development);
    Logger.info('Local SQLite database initialized');

    // Run migrations for local database
    await localDb.migrate.latest();
    Logger.info('Local database migrations completed');
    
    // Try to connect to remote PostgreSQL
    await connectToRemoteDb();
    
    // Start sync process if remote connection successful
    if (remoteDb) {
      await syncManager.syncWithRemote();
      await syncManager.startPeriodicSync();
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

