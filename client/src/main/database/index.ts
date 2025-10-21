import knex, { Knex } from "knex";
import knexConfig from "../../knexfile.js";
import Logger from "electron-log";
import dotenv from "dotenv";
import path from "path";
import { app } from "electron";
import { fileURLToPath } from "url";

export let db: Knex;

export async function initDatabase(): Promise<void> {
    try {
      const isPackaged = app.isPackaged;
        if (isPackaged) {
            Logger.info("Running in production mode",path.join(process.resourcesPath, '.env'));
            dotenv.config({ path: path.join(process.resourcesPath, '.env') });
        } else {
            dotenv.config();
        }
        let config =
            process.env.NODE_ENV === "production"
                ? knexConfig.production
                : knexConfig.development;
        const getDirname = () => {
            if (typeof __dirname !== "undefined") return __dirname;
            return path.dirname(fileURLToPath(import.meta.url));
        };
        if (process.env.NODE_ENV === "production" && app.isPackaged) {
            config = {
                ...config,
                connection: {
                    host: process.env.PG_HOST || 'localhost',
                    port: process.env.PG_PORT || 5432,
                    database: process.env.PG_DATABASE || 'restaurant_pos',
                    user: process.env.PG_USER || 'pos_admin',
                    password: process.env.PG_PASSWORD || 'your_secure_password_here'
                    },
                migrations: {
                    ...config.migrations,
                    directory: path.join(process.resourcesPath, "migrations"),
                },
            };
        }
        db = knex(config);
        Logger.info("PostgreSQL database initialized");

        // Test connection
        await db.raw("SELECT 1");
        Logger.info("Database connection successful");

        // Run migrations
        await db.migrate.latest();
        Logger.info("Database migrations completed");
    } catch (error) {
        Logger.error("Database initialization error:", error);
        throw error;
    }
}
export async function closeDatabase(): Promise<void> {
    if (db) {
        await db.destroy();
        Logger.info("Database connection closed");
    }
}
