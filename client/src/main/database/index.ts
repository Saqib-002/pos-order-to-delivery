import knex, { Knex } from "knex";
import knexConfig from "../../knexfile.js";
import Logger from "electron-log";
import path from "path";
import os from "os";
import { app } from "electron";
import dotenv from "dotenv";

export let db: Knex;
export interface DbCredentials {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    isSyncMaster?: boolean;
}

export function isLocalDatabaseHost(host: string): boolean {
    const h = (host || "").trim().toLowerCase();
    if (["localhost", "127.0.0.1", "::1", "0.0.0.0", "local"].includes(h)) {
        return true;
    }

    try {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name] || []) {
                if (iface.address && iface.address.toLowerCase() === h) {
                    return true;
                }
            }
        }
    } catch (e) {
        Logger.warn("Failed to inspect network interfaces:", e);
    }

    return false;
}

export async function initDatabase(credentials: DbCredentials): Promise<void> {
    try {
        if (db) {
            await db.destroy();
        }
        const isPackaged = app.isPackaged;
        if (isPackaged) {
            Logger.info("Running in production mode", path.join(process.resourcesPath, '.env'));
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

        // Run migrations.
        // Knex 3.x uses CREATE TABLE (without IF NOT EXISTS) for the knex_migrations and
        // knex_migrations_lock tables. When a database is restored from a backup those tables
        // already exist, which causes a "relation already exists" error before migrate.latest()
        // can even check what has been run.
        // Fix: ensure both tables exist ourselves (using IF NOT EXISTS) so Knex's internal
        // CREATE TABLE call is never reached in a conflicting state.
        await db.raw(`
            CREATE TABLE IF NOT EXISTS knex_migrations (
                id         serial primary key,
                name       varchar(255),
                batch      integer,
                migration_time timestamptz
            )
        `);
        await db.raw(`
            CREATE TABLE IF NOT EXISTS knex_migrations_lock (
                index     serial primary key,
                is_locked integer
            )
        `);
        // Seed the lock row if it doesn't exist yet (Knex expects exactly one row)
        const lockRow = await db('knex_migrations_lock').select('index').first();
        if (!lockRow) {
            await db('knex_migrations_lock').insert({ is_locked: 0 });
        }
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

        // Determine whether this instance should run background cloud sync services (web order sync, offline queues, etc.).
        // Priority:
        // 1. Explicit user toggle (`credentials.isSyncMaster`)
        // 2. Automatic detection (is target host localhost, 127.0.0.1, or any local network interface IP of this machine)
        const isMaster =
            typeof credentials.isSyncMaster === "boolean"
                ? credentials.isSyncMaster
                : isLocalDatabaseHost(credentials.host);

        if (isMaster) {
            Logger.info(
                `Server/Master POS active (host: "${credentials.host}", isSyncMaster: ${credentials.isSyncMaster ?? "auto"}). Starting background cloud sync services...`
            );
            await startCloudSyncServices();
        } else {
            Logger.info(
                `Client POS active (connected to database at "${credentials.host}"). Background cloud sync services are delegated to the Server POS.`
            );
        }
    } catch (error) {
        Logger.error("Database initialization error:", error);
        throw error;
    }
}

export async function startCloudSyncServices(): Promise<void> {
    Logger.info("Starting background cloud sync services...");
    try {
        const { startBackgroundSync } = await import("../utils/syncManager.js");
        startBackgroundSync();
    } catch (syncErr) {
        Logger.error("Failed to start background sync manager:", syncErr);
    }
    try {
        const { startQueueProcessor } = await import("../utils/sync/index.js");
        startQueueProcessor();
    } catch (queueErr) {
        Logger.error("Failed to start sync queue processor:", queueErr);
    }
    try {
        const { startWebCustomerSync } = await import("../utils/sync/webCustomer.js");
        startWebCustomerSync();
    } catch (webCustomerSyncErr) {
        Logger.error("Failed to start web customer sync:", webCustomerSyncErr);
    }
    try {
        const { startWebOrderSync } = await import("../utils/webOrderSync.js");
        startWebOrderSync();
    } catch (webOrderSyncErr) {
        Logger.error("Failed to start web order sync:", webOrderSyncErr);
    }
    try {
        const { startKitchenStatusSync } = await import("../utils/kitchenStatusSync.js");
        startKitchenStatusSync();
    } catch (kitchenSyncErr) {
        Logger.error("Failed to start kitchen status sync:", kitchenSyncErr);
    }
}

export async function stopCloudSyncServices(): Promise<void> {
    Logger.info("Stopping background cloud sync services...");
    try {
        const { stopBackgroundSync } = await import("../utils/syncManager.js");
        stopBackgroundSync();
    } catch (err) {
        Logger.error("Failed to stop background sync manager:", err);
    }
    try {
        const { stopWebOrderSync } = await import("../utils/webOrderSync.js");
        stopWebOrderSync();
    } catch (err) {
        Logger.error("Failed to stop web order sync:", err);
    }
    try {
        const { stopKitchenStatusSync } = await import("../utils/kitchenStatusSync.js");
        stopKitchenStatusSync();
    } catch (err) {
        Logger.error("Failed to stop kitchen status sync:", err);
    }
}
export async function closeDatabase(): Promise<void> {
    if (db) {
        await db.destroy();
        Logger.info("Database connection closed");
    }
}
