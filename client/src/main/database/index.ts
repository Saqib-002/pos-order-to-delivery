import knex, { Knex } from "knex";
import knexConfig from "../../knexfile.js";
import Logger from "electron-log";
import path from "path";
import { app } from "electron";
import dotenv from "dotenv";

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
        if (isPackaged) {
            Logger.info("Running in production mode",path.join(process.resourcesPath, '.env'));
            dotenv.config({ path: path.join(process.resourcesPath, '.env') });
        } else {
            dotenv.config();
        }
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

        // Check if there is no user, then add a default admin user
        const usersCount = await db("users").count("id as count").first();
        const count = usersCount ? parseInt(String((usersCount as any).count), 10) : 0;
        if (count === 0) {
            Logger.info("No users found. Creating a default admin user...");
            const bcrypt = await import("bcrypt");
            const hashedPassword = await bcrypt.hash("admin123", 10);
            const now = new Date().toISOString();
            const defaultAdmin = {
                id: "users:admin",
                username: "admin",
                password: hashedPassword,
                role: "admin",
                name: "System Administrator",
                email: "admin@restaurant.local",
                modulePermissions: JSON.stringify([]),
                functionPermissions: JSON.stringify([]),
                createdAt: now,
                updatedAt: now,
            };
            await db("users").insert(defaultAdmin);
            Logger.info("Default admin user created successfully");
        }

        // Start background sync with VPS whiteboard
        try {
            const { startBackgroundSync } = await import("../utils/syncManager.js");
            startBackgroundSync();
        } catch (syncErr) {
            Logger.error("Failed to start background sync manager:", syncErr);
        }

        // Start offline queue processor (retries failed category/subcategory syncs)
        try {
            const { startQueueProcessor } = await import("../utils/sync/index.js");
            startQueueProcessor();
        } catch (queueErr) {
            Logger.error("Failed to start sync queue processor:", queueErr);
        }

        // Start dedicated web-customer sync (polls VPS every 30s — separate from order poll)
        try {
            const { startWebCustomerSync } = await import("../utils/webCustomerSync.js");
            startWebCustomerSync();
        } catch (webCustomerSyncErr) {
            Logger.error("Failed to start web customer sync:", webCustomerSyncErr);
        }

        // Start dedicated web-order sync (polls VPS every 10s)
        try {
            const { startWebOrderSync } = await import("../utils/webOrderSync.js");
            startWebOrderSync();
        } catch (webOrderSyncErr) {
            Logger.error("Failed to start web order sync:", webOrderSyncErr);
        }

        // Start kitchen status push (posts current "sent to kitchen" count every 20s)
        try {
            const { startKitchenStatusSync } = await import("../utils/kitchenStatusSync.js");
            startKitchenStatusSync();
        } catch (kitchenSyncErr) {
            Logger.error("Failed to start kitchen status sync:", kitchenSyncErr);
        }
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
