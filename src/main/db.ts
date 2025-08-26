import PouchDB from 'pouchdb';
import dotenv from 'dotenv';
import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';
import Logger from 'electron-log';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export let db: PouchDB.Database;
export let remoteDB: PouchDB.Database;

export function initDB(): void {
  try {
    // Get user data directory for persistent storage
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'orders');
    
    console.log('Initializing database at:', dbPath);
    
    // Initialize local database
    db = new PouchDB(dbPath);
    console.log('Local database initialized successfully');
    
    // Try to connect to remote CouchDB if credentials are provided
    const couchdbUsername = process.env.COUCHDB_USERNAME;
    const couchdbPassword = process.env.COUCHDB_PASSWORD;
    const couchdbUrl = process.env.COUCHDB_URL || 'http://localhost:5984/orders';
    
    if (couchdbUsername && couchdbPassword) {
      Logger.info('Attempting to connect to remote CouchDB...');
      
      remoteDB = new PouchDB(couchdbUrl, {
        auth: {
          username: couchdbUsername,
          password: couchdbPassword,
        },
      });
      
      // Test connection
      remoteDB.info()
        .then((info) => {
          Logger.info('CouchDB connection successful', info);
          // Start sync if connection is successful
          db.sync(remoteDB, { 
            live: true, 
            retry: true,
            heartbeat: 10000,
            timeout: 20000
          })
          .on('change', (info) => {
            Logger.info('Sync change:', info);
          })
          .on('paused', () => {
            Logger.info('Sync paused');
          })
          .on('active', () => {
            Logger.info('Sync active');
          })
          .on('error', (err) => {
            Logger.error('Sync error:', err);
          });
        })
        .catch((err) => {
          Logger.error('CouchDB connection failed, using local database only:', err.message);
        });
    } else {
      Logger.warn('No CouchDB credentials provided, using local database only');
    }
    
    // Test local database
    db.info()
      .then((info) => {
        Logger.info('Local database connection successful', info);
      })
      .catch((err) => {
        Logger.error('Local database connection failed:', err.message);
      });
      
  } catch (error) {
    Logger.error('Database initialization error:', error);
    throw error;
  }
}