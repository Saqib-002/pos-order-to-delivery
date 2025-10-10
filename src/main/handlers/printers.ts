import { IpcMainInvokeEvent } from "electron";
import { PrinterDatabaseOperations } from "../database/printerOperations.js";
import { verifyToken } from "./auth.js";

export const getConnectedPrinters = async (
    event: IpcMainInvokeEvent,
    token: string
) => {
    try {
        const printers = await event.sender.getPrintersAsync();
        return {
            status: true,
            data: printers,
        };
    } catch (error) {
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};
export const createPrinter = async (
    event: IpcMainInvokeEvent,
    token: string,
    printerData: any
) => {
    try {
        await verifyToken(event, token);
        const result =
            await PrinterDatabaseOperations.createPrinter(printerData);
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
export const updatePrinter = async (
    event: IpcMainInvokeEvent,
    token: string,
    printerId: string,
    printerData: any
) => {
    try {
        await verifyToken(event, token);
        const result = await PrinterDatabaseOperations.updatePrinter(
            printerId,
            printerData
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
export const deletePrinter = async (
    event: IpcMainInvokeEvent,
    token: string,
    printerId: string
) => {
    try {
        await verifyToken(event, token);
        const result = await PrinterDatabaseOperations.deletePrinter(printerId);
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
export const getAllPrinters = async (
    event: IpcMainInvokeEvent,
    token: string
) => {
    try {
        await verifyToken(event, token);
        const result = await PrinterDatabaseOperations.getAllPrinters();
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
