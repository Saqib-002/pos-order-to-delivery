import PouchDB from 'pouchdb';
import dotenv from 'dotenv';

dotenv.config();

export let db: PouchDB.Database;

export function initDB(): void {
  db = new PouchDB('orders');

  const remoteDB = new PouchDB('http://localhost:5984/orders', {
    auth: {
      username: process.env.COUCHDB_USERNAME || '',
      password: process.env.COUCHDB_PASSWORD || '',
    },
  });

  db.sync(remoteDB, { live: true, retry: true }).on('error', (err) => {
    console.error('Sync error:', err);
  });
}