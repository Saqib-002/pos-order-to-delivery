import { Category, SubCategory } from "@/types/categories";
import { randomUUID } from "crypto";
import Logger from "electron-log";
import { db } from "./index.js";
import { uploadImg } from "../utils/utils.js";
import dotenv from "dotenv";
dotenv.config();

export class CategoryDatabaseOperations {
    static async createCategory(
        category: Omit<Category, "id" | "createdAt" | "updatedAt" | "isDeleted">
    ) {
        try {
            const now = new Date().toISOString();
            const id = randomUUID();
            if (category.imgUrl && !category.imgUrl.startsWith("http")) {
                category.imgUrl = await uploadImg(category.imgUrl, false);
            }
            const newCategory = {
                id,
                ...category,
                createdAt: now,
                updatedAt: now,
            };

            await db("categories").insert(newCategory);
            Logger.info(`Category created: ${newCategory.categoryName}`);
            const uploadUrl = process.env.CDN_URL;
            return {
                newCategory,
                imgUrl: `${category.imgUrl ? `${uploadUrl}/uploads/${category.imgUrl}` : ""}`,
            };
        } catch (error) {
            throw error;
        }
    }
    static async getCategories() {
        try {
            let query = db("categories")
                .select(
                    "categories.*",
                    db.raw(
                        '(SELECT COUNT(*) FROM sub_categories WHERE "categoryId" = categories.id) as "itemCount"'
                    )
                )
                .orderBy("categories.categoryName", "asc");
            const categories = await query;
            return categories.map((c) => ({
                ...c,
                imgUrl: `${c.imgUrl ? `${process.env.CDN_URL}/uploads/${c.imgUrl}` : ""}`,
            }));
        } catch (error) {
            throw error;
        }
    }
    static async deleteCategory(id: string) {
        try {
            await db("categories").where("id", id).delete();
            Logger.info(`Category deleted: ${id}`);
        } catch (error) {
            throw error;
        }
    }
    static async updateCategory(id: string, updates: Partial<Category>) {
        try {
            const now = new Date().toISOString();
            if (updates.imgUrl && !updates.imgUrl.startsWith("http")) {
                updates.imgUrl = await uploadImg(updates.imgUrl, false);
            } else if (updates.imgUrl) {
                updates.imgUrl = updates.imgUrl?.split("/").at(-1);
            }
            const updatedCategory = await db("categories")
                .where("id", id)
                .update({
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
export class SubCategoriesOperations {
    static async createSubCategory(
        subcategory: Omit<
            SubCategory,
            "id" | "createdAt" | "updatedAt" | "isDeleted"
        >
    ) {
        try {
            const now = new Date().toISOString();
            const id = randomUUID();
            if (subcategory.imgUrl && !subcategory.imgUrl.startsWith("http")) {
                subcategory.imgUrl = await uploadImg(subcategory.imgUrl, false);
            }
            const newSubcategory = {
                id,
                ...subcategory,
                createdAt: now,
                updatedAt: now,
            };
            await db("sub_categories").insert(newSubcategory);
            Logger.info(`Sub Category created: ${newSubcategory.name}`);
            return newSubcategory;
        } catch (error) {
            throw error;
        }
    }
    static async getSubCategories(categoryId: string) {
        try {
            let query = db("sub_categories")
                .where("categoryId", categoryId)
                .select(
                    "sub_categories.*",
                    db.raw(
                        '(SELECT COUNT(*) FROM products WHERE "subcategoryId" = sub_categories.id) as "itemCount"'
                    ),
                    db.raw(
                        '(SELECT COUNT(*) FROM menus WHERE "subcategoryId" = sub_categories.id) as "menuCount"'
                    )
                )
                .orderBy("name", "asc");
            const subCategories = await query;
            const uploadUrl = process.env.CDN_URL;
            return subCategories.map((s) => {
                return {
                    ...s,
                    imgUrl: `${s.imgUrl ? `${uploadUrl}/uploads/${s.imgUrl}` : ""}`,
                };
            });
        } catch (error) {
            throw error;
        }
    }
    static async getAllSubCategories() {
        try {
            let query = db("sub_categories").orderBy("name", "asc");
            const subCategories = await query;
            const uploadUrl = process.env.CDN_URL;
            return subCategories.map((s) => {
                return {
                    ...s,
                    imgUrl: `${s.imgUrl ? `${uploadUrl}/uploads/${s.imgUrl}` : ""}`,
                };
            });
        } catch (error) {
            throw error;
        }
    }
    static async deleteSubCategory(id: string) {
        try {
            await db("sub_categories").where("id", id).delete();
            Logger.info(`Sub Category deleted: ${id}`);
        } catch (error) {
            throw error;
        }
    }
    static async updateSubCategory(id: string, updates: Partial<SubCategory>) {
        try {
            const now = new Date().toISOString();
            if (updates.imgUrl && !updates.imgUrl.startsWith("http")) {
                updates.imgUrl = await uploadImg(updates.imgUrl, false);
            } else if (updates.imgUrl) {
                updates.imgUrl = updates.imgUrl?.split("/").at(-1);
            }
            const updatedSubCategory = await db("sub_categories")
                .where("id", id)
                .update({
                    ...updates,
                    updatedAt: now,
                });
            Logger.info(`Sub Category updated: ${id}`);
            return updatedSubCategory;
        } catch (error) {
            throw error;
        }
    }
}
