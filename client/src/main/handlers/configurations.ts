import { IpcMainInvokeEvent } from "electron";
import { verifyToken } from "./auth.js";
import { ConfigurationsDatabaseOperations } from "../database/configurationsOperations.js";
import { uploadImg } from "../utils/utils.js";

export const createConfigurations = async (
    event: IpcMainInvokeEvent,
    token: string,
    configData: any
) => {
    try {
        await verifyToken(event, token);
        if (configData.logo && !configData.logo.startsWith("http")) {
            configData.logo = await uploadImg(
                configData.logo,true
            );
        }
        const result =
            await ConfigurationsDatabaseOperations.createConfigurations(
                configData
            );
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const getConfigurations = async (
    event: IpcMainInvokeEvent,
    token: string
) => {
    try {
        await verifyToken(event, token);
        const result =
            await ConfigurationsDatabaseOperations.getConfigurations();
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const updateConfigurations = async (
    event: IpcMainInvokeEvent,
    token: string,
    id: string,
    updates: Partial<any>
) => {
    try {
        await verifyToken(event, token);
        if (updates.logo && !updates.logo.startsWith("http")) {
            updates.logo = await uploadImg(
                updates.logo,true
            );
        }else if (updates.logo){
            updates.logo = updates.logo?.split("/").at(-1);
        }
        const result =
            await ConfigurationsDatabaseOperations.updateConfigurations(
                id,
                updates
            );
        return {
            status: true,
            data: result,
        };
    } catch (error) {
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};

const DEFAULT_SYNC_URL = "https://thunderjaw-licenses.vercel.app/api/v2/config";

export const syncAuthorInfo = async (
    event: IpcMainInvokeEvent,
    token: string
) => {
    try {
        await verifyToken(event, token);
        const config = await ConfigurationsDatabaseOperations.getConfigurations();
        const syncUrl = config?.externalApiUrl || DEFAULT_SYNC_URL;

        const response = await fetch(syncUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch from external API: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Map external data to our local schema
        const updates: any = {};
        if (data.authorName) updates.authorName = data.authorName;
        if (data.authorWebsite) updates.authorWebsite = data.authorWebsite;
        if (data.authorEmail) updates.authorEmail = data.authorEmail;
        if (data.softwareVersion) updates.softwareVersion = data.softwareVersion;
        if (data.contactTypes) updates.contactTypes = data.contactTypes;
        if (data.newSyncUrl) updates.externalApiUrl = data.newSyncUrl;

        if (Object.keys(updates).length > 0 && config?.id) {
            await ConfigurationsDatabaseOperations.updateConfigurations(config.id, updates);
            const updatedConfig = await ConfigurationsDatabaseOperations.getConfigurations();
            return {
                status: true,
                data: updatedConfig,
            };
        }

        return {
            status: true,
            data: config,
            message: "No updates found"
        };
    } catch (error) {
        console.error("Sync error:", error);
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
