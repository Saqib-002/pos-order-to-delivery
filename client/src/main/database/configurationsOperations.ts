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
      if (processedData.deliveryMinOrderRanges !== undefined) {
        processedData.deliveryMinOrderRanges = JSON.stringify(
          processedData.deliveryMinOrderRanges || []
        );
      }
      if (processedData.contactTypes !== undefined) {
        processedData.contactTypes = JSON.stringify(
          processedData.contactTypes || []
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

        if (configurations.deliveryMinOrderRanges) {
          try {
            if (typeof configurations.deliveryMinOrderRanges === "string") {
              configurations.deliveryMinOrderRanges = JSON.parse(
                configurations.deliveryMinOrderRanges
              );
            }
            if (!Array.isArray(configurations.deliveryMinOrderRanges)) {
              configurations.deliveryMinOrderRanges = [];
            }
          } catch (parseError) {
            console.warn(
              "Failed to parse deliveryMinOrderRanges:",
              parseError
            );
            configurations.deliveryMinOrderRanges = [];
          }
        } else {
          configurations.deliveryMinOrderRanges = [];
        }

        if (configurations.contactTypes) {
          try {
            if (typeof configurations.contactTypes === "string") {
              configurations.contactTypes = JSON.parse(
                configurations.contactTypes
              );
            }
            if (!Array.isArray(configurations.contactTypes)) {
              configurations.contactTypes = [];
            }
          } catch (parseError) {
            console.warn("Failed to parse contactTypes:", parseError);
            configurations.contactTypes = [];
          }
        } else {
          configurations.contactTypes = [];
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
      delete processedUpdates.id;
      if (processedUpdates.kitchenTimeEstimationRanges !== undefined) {
        processedUpdates.kitchenTimeEstimationRanges = JSON.stringify(
          processedUpdates.kitchenTimeEstimationRanges || []
        );
      }
      if (processedUpdates.deliveryMinOrderRanges !== undefined) {
        processedUpdates.deliveryMinOrderRanges = JSON.stringify(
          processedUpdates.deliveryMinOrderRanges || []
        );
      }
      if (processedUpdates.contactTypes !== undefined) {
        processedUpdates.contactTypes = JSON.stringify(
          processedUpdates.contactTypes || []
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
