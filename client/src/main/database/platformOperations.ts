import { randomUUID } from "crypto";
import { db } from "./index.js";

export class PlatformDatabaseOperations {
  static async createPlatform(platformData: any) {
    try {
      const existingPlatform = await db("platforms")
        .where("name", platformData.name)
        .first();
      if (existingPlatform) {
        throw new Error("Platform with the same name already exists.");
      }
      const now = new Date().toISOString();
      const newPlatform = {
        id: randomUUID(),
        ...platformData,
        createdAt: now,
        updatedAt: now,
      };
      await db("platforms").insert(newPlatform);
      return newPlatform;
    } catch (error) {
      throw error;
    }
  }

  static async updatePlatform(platformId: string, platformData: any) {
    try {
      const existingPlatform = await db("platforms")
        .where("name", platformData.name)
        .whereNot("id", platformId)
        .first();
      if (existingPlatform) {
        throw new Error("Platform with the same name already exists.");
      }
      const now = new Date().toISOString();
      const updatedPlatform = {
        ...platformData,
        updatedAt: now,
      };
      await db("platforms").where("id", platformId).update(updatedPlatform);
      return updatedPlatform;
    } catch (error) {
      throw error;
    }
  }

  static async deletePlatform(platformId: string) {
    try {
      await db("platforms").where("id", platformId).delete();
    } catch (error) {
      throw error;
    }
  }

  static async getAllPlatforms() {
    try {
      const platforms = await db("platforms").orderBy("name", "asc");
      return platforms;
    } catch (error) {
      throw error;
    }
  }

  static async getPlatformById(platformId: string) {
    try {
      const platform = await db("platforms").where("id", platformId).first();
      return platform;
    } catch (error) {
      throw error;
    }
  }
}
