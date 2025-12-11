import { Category, SubCategory } from "@/types/categories";
import { randomUUID } from "crypto";
import { db } from "./index.js";
import { deleteImg, uploadImg } from "../utils/utils.js";
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
            const category = await db("categories").where("id", id).first();
            if (category && category.imgUrl) {
                const res=await deleteImg(category.imgUrl);
                if(!res) throw new Error("Failed to delete image");
            }
            await db("categories").where("id", id).delete();
        } catch (error) {
            throw error;
        }
    }
    static async updateCategory(id: string, updates: Partial<Category>) {
        try {
            const now = new Date().toISOString();
            const category = await db("categories").where("id", id).first();
            let updateUrl=updates.imgUrl;
            if(updateUrl){
                updateUrl=updateUrl.split("/").at(-1);
            }
            if (category && category.imgUrl && category.imgUrl !== updateUrl) {
                const res=await deleteImg(category.imgUrl);
                if(!res) throw new Error("Failed to delete image");
            }
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
                        '(SELECT COUNT(*) FROM products WHERE "subcategoryId" = sub_categories.id AND "name" <> \'250f812e66c1afab64c57bcea36bb3b7\') as "itemCount"'
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
            const subcategory = await db("sub_categories")
                .where("id", id)
                .first();
            if (subcategory && subcategory.imgUrl) {
                const res=await deleteImg(subcategory.imgUrl);
                if(!res) throw new Error("Failed to delete image");
            }
            await db("sub_categories").where("id", id).delete();
        } catch (error) {
            throw error;
        }
    }
    static async updateSubCategory(id: string, updates: Partial<SubCategory>) {
        try {
            const now = new Date().toISOString();
            const subcategory = await db("sub_categories")
                .where("id", id)
                .first();
            let updateUrl=updates.imgUrl;
            if(updateUrl){
                updateUrl=updateUrl.split("/").at(-1);
            }
            if (subcategory && subcategory.imgUrl && subcategory.imgUrl !== updateUrl) {
                const res=await deleteImg(subcategory.imgUrl);
                if(!res) throw new Error("Failed to delete image");
            }
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
            return updatedSubCategory;
        } catch (error) {
            throw error;
        }
    }
}
