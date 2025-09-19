import { Variant, VariantItem } from "@/types/Variants.js";
import { db } from "./index.js";
import { randomUUID } from "crypto";

export class VariantsDatabaseOperations {
    static async createVariant(
        variantData: Omit<Variant, "id" | "createdAt" | "updatedAt">,
        variantItems: VariantItem[]
    ) {
        {
            const trx = await db.transaction();
            try {
                const now = new Date().toISOString();
                const newVariant = {
                    id: randomUUID(),
                    ...variantData,
                    createdAt: now,
                    updatedAt: now,
                };
                await trx("variants").insert(newVariant);
                const newVariantItems = [];
                for (const item of variantItems) {
                    const newItem = {
                        ...item,
                        id: randomUUID(),
                        variantId: newVariant.id,
                        createdAt: now,
                        updatedAt: now,
                    };
                    await trx("variant_items").insert(newItem);
                    newVariantItems.push(newItem);
                }
                await trx.commit();
                return {
                    variant: newVariant,
                    variantItems: newVariantItems,
                };
            } catch (error) {
                await trx.rollback();
                throw error;
            }
        }
    }
    static async getVariants() {
        try {
            let query = db("variants")
                .select(
                    "variants.id as variantId",
                    "variants.groupName",
                    "variants.createdAt as variantCreatedAt",
                    "variants.updatedAt as variantUpdatedAt",
                    "variant_items.id as itemId",
                    "variant_items.name as itemName",
                    "variant_items.priority",
                    "variant_items.createdAt as itemCreatedAt",
                    "variant_items.updatedAt as itemUpdatedAt"
                )
                .leftJoin(
                    "variant_items",
                    "variants.id",
                    "variant_items.variantId"
                )
                .orderBy("variants.createdAt", "asc")
                .orderBy("variant_items.priority", "dsc");
            const variantsMap = new Map();
            const rows = await query;

            rows.forEach((row) => {
                const variant = {
                    id: row.variantId,
                    groupName: row.groupName,
                    createdAt: row.variantCreatedAt,
                    updatedAt: row.variantUpdatedAt,
                    items: [],
                };
                if (!variantsMap.has(row.variantId)) {
                    variantsMap.set(row.variantId, variant);
                }
                if (row.itemId) {
                    variantsMap.get(row.variantId).items.push({
                        id: row.itemId,
                        name: row.itemName,
                        priority: row.priority,
                        createdAt: row.itemCreatedAt,
                        updatedAt: row.itemUpdatedAt,
                    });
                }
            });
            return Array.from(variantsMap.values());
        } catch (error) {
            throw error;
        }
    }
    static async deleteVariant(variantId: string) {
        try {
            await db("variants").where("id", variantId).delete();
        } catch (error) {
            throw error;
        }
    }
    static async updateVariant(
        variantData: Omit<Variant, "createdAt" | "updatedAt">,
        variantItems: VariantItem[]
    ) {
        const trx=await db.transaction()
        try {
            const now = new Date().toISOString();
            await trx("variants")
                .where("id", variantData.id)
                .update(variantData);
            await trx("variant_items")
                .where("variantId", variantData.id)
                .delete();
            for (const item of variantItems) {
                await trx("variant_items").insert({
                    ...item,
                    id: randomUUID(),
                    variantId: variantData.id,
                    createdAt: now,
                    updatedAt: now,
                });
            }
            await trx.commit()
        } catch (error) {
            await trx.rollback()
            throw error;
        }
    }
}
