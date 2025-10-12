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
    static async uploadLogo(base64Logo: string): Promise<string> {
        const matches = base64Logo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error("Invalid base64 string");
        }
        const [, mimeType, base64Data] = matches;
        const buffer = Buffer.from(base64Data, "base64");
        const formData = new FormData();
        const ext = mimeType.split("/")[1];
        const blob = new Blob([buffer], { type: mimeType });
        formData.append("file", blob, `logo.${ext}`);
        const uploadUrl = process.env.CDN_URL;
        if (!uploadUrl) {
            throw new Error("CDN_URL environment variable is not set");
        }
        const response = await fetch(`${uploadUrl}/upload`, {
            method: "POST",
            body: formData,
        });
        if (!response.ok) {
            return "";
        }
        const data = await response.json();
        return `logo.${ext}`;
    }
}
