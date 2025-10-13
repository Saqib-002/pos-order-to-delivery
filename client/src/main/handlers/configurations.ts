import { IpcMainInvokeEvent } from "electron";
import { verifyToken } from "./auth.js";
import { ConfigurationsDatabaseOperations } from "../database/configurationsOperations.js";

export const createConfigurations = async (
    event: IpcMainInvokeEvent,
    token: string,
    configData: any
) => {
    try {
        await verifyToken(event, token);
        if (configData.logo && !configData.logo.startsWith("http")) {
            configData.logo = await ConfigurationsDatabaseOperations.uploadLogo(
                configData.logo
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
            updates.logo = await ConfigurationsDatabaseOperations.uploadLogo(
                updates.logo
            );
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
