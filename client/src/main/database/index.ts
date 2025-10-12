import knex, { Knex } from 'knex';
import knexConfig from '../../knexfile.js';
import Logger from 'electron-log';
import dotenv from 'dotenv';

dotenv.config();
export let db: Knex;

export async function initDatabase(): Promise<void> {
  try {
    const config = process.env.NODE_ENV === 'production' 
      ? knexConfig.production 
      : knexConfig.development;
    db = knex(config);
    Logger.info('PostgreSQL database initialized');

    // Test connection
    await db.raw('SELECT 1');
    Logger.info('Database connection successful');

    // Run migrations
    await db.migrate.latest();
    Logger.info('Database migrations completed');


  } catch (error) {
    Logger.error('Database initialization error:', error);
    throw error;
  }
}
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    Logger.info('Database connection closed');
  }
}