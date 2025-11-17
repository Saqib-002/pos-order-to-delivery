import knex, { Knex } from "knex";
import knexConfig from "../../knexfile.js";
import Logger from "electron-log";
import path from "path";
import { app } from "electron";

export let db: Knex;
interface DbCredentials {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}

export async function initDatabase(credentials: DbCredentials): Promise<void> {
    try {
        if (db) {
            await db.destroy();
        }
        const isPackaged = app.isPackaged;
        let configBase =
            process.env.NODE_ENV === "production"
                ? knexConfig.production
                : knexConfig.development;
        const dynamicConfig: Knex.Config = {
            ...configBase,
            client: "pg",
            connection: {
                host: credentials.host,
                port: Number(credentials.port),
                database: credentials.database,
                user: credentials.user,
                password: credentials.password,
            },
            pool: { min: 2, max: 10 },
        };
        if (isPackaged) {
            dynamicConfig.migrations = {
                ...dynamicConfig.migrations,
                directory: path.join(process.resourcesPath, "migrations"),
            };
        }
        db = knex(dynamicConfig);
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
