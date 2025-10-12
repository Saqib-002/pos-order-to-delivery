import { BrowserWindow } from "electron";
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
export const getProductPrinters = async (
    event: IpcMainInvokeEvent,
    token: string,
    productId: string
) => {
    try {
        await verifyToken(event, token);
        const result =
            await PrinterDatabaseOperations.getProductPrinters(productId);
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

export const printToPrinter = async (
    event: IpcMainInvokeEvent,
    token: string,
    printerName: string,
    printData: { html: string; options?: any }
) => {
    try {
        await verifyToken(event, token);

        // Create a new hidden BrowserWindow for printing
        const printWindow = new BrowserWindow({
            width: 800,
            height: 600,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            },
        });
        const printers = await event.sender.getPrintersAsync();
        const targetPrinter = printers.find((p) => p.name === printerName);
        if (!targetPrinter) {
            return {
                status: false,
                error: "Printer not found among connected printers.",
            };
        }
        // Load the HTML content and wait for it to finish loading
        await printWindow.webContents.loadURL(
            `data:text/html;charset=utf-8,${encodeURIComponent(printData.html)}`
        );
        const printOptions = {
            silent: true,
            deviceName: printerName,
            printBackground: true,
            color: false,
            margins: {
                marginType: "none",
            },
            ...printData.options,
        };
        
        // Print silently to the specific printer
        const printPromise = new Promise((resolve, reject) => {
            printWindow.webContents.print(
                printOptions,
                (success, errorType) => {
                    if (success) {
                        resolve(success);
                    } else {
                        reject(new Error(`Print failed: ${errorType}`));
                    }
                }
            );
        });
        
        await printPromise;
        
        // Close the window
        printWindow.close();

        return {
            status: true,
            data: { message: "Print job sent successfully" },
        };
    } catch (error) {
        return {
            status: false,
            error: (error as Error).message,
        };
    }
};