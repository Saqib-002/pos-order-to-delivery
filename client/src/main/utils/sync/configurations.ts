import { db } from "../../database/index.js";
import { enqueue } from "./queue/index.js";
import Logger from "electron-log";

/**
 * Enqueue the restaurant configuration to sync to the VPS v1 API.
 * Called whenever the configuration is created or updated in the local POS DB.
 */
export async function syncConfigToVPS(configId: string): Promise<void> {
    try {
        const config = await db("configurations").where({ id: configId }).first();
        if (!config) return;

        enqueue("configuration", "upsert", {
            id: config.id,
            name: config.name || "",
            address: config.address || "",
            logo: config.logo || "",
            lowKitchenPriorityTime: config.lowKitchenPriorityTime,
            mediumKitchenPriorityTime: config.mediumKitchenPriorityTime,
            highKitchenPriorityTime: config.highKitchenPriorityTime,
            vatNumber: config.vatNumber,
            orderPrefix: config.orderPrefix,
            apartment: config.apartment,
            postalCode: config.postalCode,
            city: config.city,
            province: config.province,
            googleMapsApiKey: config.googleMapsApiKey,
            kitchenTimeEstimationRanges: config.kitchenTimeEstimationRanges,
            authorName: config.authorName,
            authorWebsite: config.authorWebsite,
            authorEmail: config.authorEmail,
            softwareVersion: config.softwareVersion,
            contactTypes: config.contactTypes,
            externalApiUrl: config.externalApiUrl,
            deliveryZones: config.deliveryZones,
        });
    } catch (err) {
        Logger.error(`SyncQueue [configurations]: error queuing config ${configId}:`, err);
    }
}
