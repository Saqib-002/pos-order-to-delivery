import PouchDB from 'pouchdb';
import dotenv from 'dotenv';
import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export let db: PouchDB.Database;

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
      console.log('Attempting to connect to remote CouchDB...');
      
      const remoteDB = new PouchDB(couchdbUrl, {
        auth: {
          username: couchdbUsername,
          password: couchdbPassword,
        },
      });
      
      // Test connection
      remoteDB.info()
        .then((info) => {
          console.log('CouchDB connection successful:', info);
          
          // Start sync if connection is successful
          db.sync(remoteDB, { 
            live: true, 
            retry: true,
            heartbeat: 10000,
            timeout: 20000
          })
          .on('change', (info) => {
            console.log('Sync change:', info);
          })
          .on('paused', () => {
            console.log('Sync paused');
          })
          .on('active', () => {
            console.log('Sync active');
          })
          .on('error', (err) => {
            console.error('Sync error:', err);
          });
        })
        .catch((err) => {
          console.warn('CouchDB connection failed, using local database only:', err.message);
        });
    } else {
      console.log('No CouchDB credentials provided, using local database only');
    }
    
    // Test local database
    db.info()
      .then((info) => {
        console.log('Local database info:', info);
      })
      .catch((err) => {
        console.error('Local database error:', err);
      });
      
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}