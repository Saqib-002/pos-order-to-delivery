import { randomUUID } from "crypto";
import { db } from "./index.js";

export class ConfigurationsDatabaseOperations {
    static async createConfigurations(configData: any) {
        try {
            const id=randomUUID();
            await db("configurations").insert({
                ...configData,
                id,
            });
            return {id,...configData};
        } catch (error) {
            throw error;
        }
    }

    static async getConfigurations() {
        try {
            const configurations = await db("configurations")
                .select("*")
                .first();
            return configurations;
        } catch (error) {
            throw error;
        }
    }

    static async updateConfigurations(id: string, updates: Partial<any>) {
        try {
            const updatedConfig = await db("configurations")
                .where("id", id)
                .update({
                    ...updates,
                });
            return updatedConfig;
        } catch (error) {
            throw error;
        }
    }
}
