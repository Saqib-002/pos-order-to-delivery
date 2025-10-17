import { randomUUID } from "crypto";
import { db } from "./index.js";
import dotenv from "dotenv";
dotenv.config();

export class ConfigurationsDatabaseOperations {
    static async createConfigurations(configData: any) {
        try {
            const id = randomUUID();
            await db("configurations").insert({
                ...configData,
                id,
            });
            return { ...configData };
        } catch (error) {
            throw error;
        }
    }

    static async getConfigurations() {
        try {
            let configurations = await db("configurations").select("*").first();
            if (configurations && configurations.logo) {
                const uploadUrl = process.env.CDN_URL;
                if (uploadUrl) {
                    configurations.logo = `${uploadUrl}/uploads/${configurations.logo}`;
                }
            }
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
