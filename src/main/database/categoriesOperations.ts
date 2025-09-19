import { Category } from "@/types/categories";
import { randomUUID } from "crypto";
import Logger from "electron-log";
import { db } from "./index.js";

export class CategoryDatabaseOperations {
    static async createCategory(
        category: Omit<Category, "id" | "createdAt" | "updatedAt" | "isDeleted">
    ) {
        try {
            const now = new Date().toISOString();
            const id = randomUUID();

            const newCategory = {
                id,
                ...category,
                createdAt: now,
                updatedAt: now,
            };

            await db("categories").insert(newCategory);
            Logger.info(`Delivery person created: ${newCategory.categoryName}`);
            return newCategory;
        } catch (error) {
            throw error;
        }
    }
    static async getCategories(){
        try {
            let query=db("categories").where("isDeleted", false).orderBy("categoryName", "asc");
            const categories = await query;
            return categories;
        } catch (error) {
            throw error;
        }
    }
    static async deleteCategory(id: string) {
        try {
            const now = new Date().toISOString();
            await db("categories").where("id", id).update({
                isDeleted: true,
                updatedAt: now,
            });
            Logger.info(`Category deleted: ${id}`);
        } catch (error) {
            throw error;
        }
    }
    static async updateCategory(id: string, updates: Partial<Category>) {
        try {
            const now = new Date().toISOString();
            const updatedCategory = await db("categories").where("id", id).update({
                ...updates,
                updatedAt: now,
            });
            Logger.info(`Category updated: ${id}`);
            return updatedCategory;
        } catch (error) {
            throw error;
        }
    }
}
