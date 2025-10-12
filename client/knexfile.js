import dotenv from 'dotenv';

dotenv.config();


const knexConfig = {
  development: {
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