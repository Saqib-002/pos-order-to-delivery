import { randomUUID } from "crypto";
import { db } from "./index.js";

export class PrinterDatabaseOperations {
    static async createPrinter(printerData: any) {
        try {
            const existingPrinter = await db("printers")
                .where("name", printerData.name)
                .first();
            if (existingPrinter) {
                throw new Error("Printer with the same name already exists.");
            }
            const now = new Date().toISOString();
            const newPrinter = {
                id:randomUUID(),
                ...printerData,
                createdAt: now,
                updatedAt: now,
            };
            await db("printers").insert(newPrinter);
        } catch (error) {
            throw error;
        }
    }
    static async updatePrinter(printerId: string, printerData: any) {
        try {
            const now = new Date().toISOString();
            const updatedPrinter = {
                ...printerData,
                updatedAt: now,
            };
            await db("printers").where("id", printerId).update(updatedPrinter);
        } catch (error) {
            throw error;
        }
    }
    static async deletePrinter(printerId: string) {
        try {
            await db("printers").where("id", printerId).delete();
        } catch (error) {
            throw error;
        }
    }
    static async getAllPrinters() {
        try {
            const printers = await db("printers");
            return printers;
        } catch (error) {
            throw error;
        }
    }
}
