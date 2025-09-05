import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getUserDataPath = () => {
    return path.join(__dirname, 'data');
};

const knexConfig = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(getUserDataPath(), 'restaurant.sqlite')
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  
  production: {
    client: 'pg',
    connection: {
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      database: process.env.PG_DATABASE || 'restaurant_pos',
      user: process.env.PG_USER || 'pos_admin',
      password: process.env.PG_PASSWORD || 'your_secure_password_here'
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};

export default knexConfig;