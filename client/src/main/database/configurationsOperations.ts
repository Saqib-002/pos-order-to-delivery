import { randomUUID } from "crypto";
import { db } from "./index.js";
import dotenv from "dotenv";
import Store from "electron-store";
const store = new Store();
dotenv.config();

export class ConfigurationsDatabaseOperations {
  static async createConfigurations(configData: any) {
    try {
      const id = randomUUID();
      const processedData = { ...configData };
      if (processedData.kitchenTimeEstimationRanges !== undefined) {
        processedData.kitchenTimeEstimationRanges = JSON.stringify(
          processedData.kitchenTimeEstimationRanges || []
        );
      }

      await db("configurations").insert({
        ...processedData,
        id,
      });
      return { ...configData };
    } catch (error) {
      console.error("Database create error:", error);
      throw error;
    }
  }

  static async getConfigurations() {
    try {
      let configurations = await db("configurations").select("*").first();
      if (configurations) {
        if (configurations.kitchenTimeEstimationRanges) {
          try {
            if (
              typeof configurations.kitchenTimeEstimationRanges === "string"
            ) {
              configurations.kitchenTimeEstimationRanges = JSON.parse(
                configurations.kitchenTimeEstimationRanges
              );
            }
            if (!Array.isArray(configurations.kitchenTimeEstimationRanges)) {
              configurations.kitchenTimeEstimationRanges = [];
            }
          } catch (parseError) {
            console.warn(
              "Failed to parse kitchenTimeEstimationRanges:",
              parseError
            );
            configurations.kitchenTimeEstimationRanges = [];
          }
        } else {
          configurations.kitchenTimeEstimationRanges = [];
        }

        if (configurations.logo) {
          const uploadUrl = (store as any).get("cdnUrl");
          if (uploadUrl) {
            configurations.logo = `${uploadUrl}/uploads/${configurations.logo}`;
          }
        }
      }
      return configurations;
    } catch (error) {
      throw error;
    }
  }

  static async updateConfigurations(id: string, updates: Partial<any>) {
    try {
      const processedUpdates = { ...updates };
      if (processedUpdates.kitchenTimeEstimationRanges !== undefined) {
        processedUpdates.kitchenTimeEstimationRanges = JSON.stringify(
          processedUpdates.kitchenTimeEstimationRanges || []
        );
      }

      const updatedConfig = await db("configurations")
        .where("id", id)
        .update(processedUpdates);
      return updatedConfig;
    } catch (error) {
      console.error("Database update error:", error);
      throw error;
    }
  }
}
