import { randomUUID } from "crypto";
import { db } from "./index.js";
import { deleteImg, uploadImg } from "../utils/utils.js";
import { syncAllergenToVPS, deleteAllergenFromVPS, syncProductAllergensToVPS } from "../utils/sync/allergens.js";
import Store from "electron-store";

const store = new Store();

function formatIconUrl(icon: string | null | undefined): string | null {
  if (!icon) return null;
  if (
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("data:") ||
    icon.startsWith("blob:")
  ) {
    return icon;
  }
  const cdnUrl = ((store as any).get("cdnUrl") || "").replace(/\/+$/, "");
  const cleanIcon = icon.replace(/^\/+/, "").replace(/^uploads\//, "");
  return cdnUrl ? `${cdnUrl}/uploads/${cleanIcon}` : `/uploads/${cleanIcon}`;
}

export class AllergenDatabaseOperations {
  static async createAllergen(allergenData: any) {
    try {
      const existingAllergen = await db("allergens")
        .where("nameEs", allergenData.nameEs)
        .first();
      if (existingAllergen) {
        throw new Error("An allergen with the same Spanish name already exists.");
      }

      let iconFilename = allergenData.icon || null;
      if (iconFilename && iconFilename.startsWith("data:")) {
        iconFilename = await uploadImg(iconFilename, false);
      }

      const now = new Date().toISOString();
      const newAllergen = {
        id: allergenData.id || `allergens:${randomUUID()}`,
        nameEs: allergenData.nameEs,
        nameEn: allergenData.nameEn || "",
        icon: iconFilename,
        createdAt: now,
        updatedAt: now,
      };
      await db("allergens").insert(newAllergen);

      // Queue VPS sync
      syncAllergenToVPS(newAllergen.id);

      return {
        ...newAllergen,
        icon: formatIconUrl(newAllergen.icon),
      };
    } catch (error) {
      throw error;
    }
  }

  static async updateAllergen(allergenId: string, allergenData: any) {
    try {
      const existingAllergen = await db("allergens")
        .where("id", allergenId)
        .first();
      if (!existingAllergen) {
        throw new Error("Allergen not found");
      }

      if (allergenData.nameEs) {
        const duplicate = await db("allergens")
          .where("nameEs", allergenData.nameEs)
          .whereNot("id", allergenId)
          .first();
        if (duplicate) {
          throw new Error("An allergen with the same Spanish name already exists.");
        }
      }

      let iconFilename = allergenData.icon;
      if (iconFilename && iconFilename.startsWith("data:")) {
        // Delete old image if present
        if (existingAllergen.icon) {
          await deleteImg(existingAllergen.icon);
        }
        iconFilename = await uploadImg(iconFilename, false);
      } else if (iconFilename === null && existingAllergen.icon) {
        await deleteImg(existingAllergen.icon);
      }

      const now = new Date().toISOString();
      const updatedAllergen: any = {
        nameEs: allergenData.nameEs,
        nameEn: allergenData.nameEn ?? "",
        updatedAt: now,
      };
      if (iconFilename !== undefined) {
        updatedAllergen.icon = iconFilename;
      }

      await db("allergens")
        .where("id", allergenId)
        .update(updatedAllergen);

      // Queue VPS sync
      syncAllergenToVPS(allergenId);

      const currentIcon = iconFilename !== undefined ? iconFilename : existingAllergen.icon;
      return {
        id: allergenId,
        ...updatedAllergen,
        icon: formatIconUrl(currentIcon),
      };
    } catch (error) {
      throw error;
    }
  }

  static async deleteAllergen(allergenId: string) {
    try {
      const existingAllergen = await db("allergens")
        .where("id", allergenId)
        .first();
      if (existingAllergen && existingAllergen.icon) {
        await deleteImg(existingAllergen.icon);
      }

      await db("allergens").where("id", allergenId).delete();

      // Queue VPS sync
      deleteAllergenFromVPS(allergenId);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  static async getAllAllergens() {
    try {
      const allergens = await db("allergens").orderBy("nameEs", "asc");
      return allergens.map((a: any) => ({
        ...a,
        icon: formatIconUrl(a.icon),
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getAllergenById(allergenId: string) {
    try {
      const allergen = await db("allergens")
        .where("id", allergenId)
        .first();
      if (!allergen) return null;
      return {
        ...allergen,
        icon: formatIconUrl(allergen.icon),
      };
    } catch (error) {
      throw error;
    }
  }

  static async getProductAllergensByProductId(productId: string) {
    try {
      const rows = await db("products_allergens")
        .join("allergens", "products_allergens.allergenId", "allergens.id")
        .where("products_allergens.productId", productId)
        .select(
          "products_allergens.allergenId",
          "products_allergens.type",
          "allergens.nameEs",
          "allergens.nameEn",
          "allergens.icon"
        );
      return rows.map((r: any) => ({
        ...r,
        icon: formatIconUrl(r.icon),
      }));
    } catch (error) {
      throw error;
    }
  }

  static async updateProductAllergens(
    productId: string,
    allergens: Array<{ allergenId: string; type: "contains" | "traces" }>
  ) {
    try {
      await db.transaction(async (trx) => {
        await trx("products_allergens").where("productId", productId).delete();
        if (allergens && allergens.length > 0) {
          const now = new Date().toISOString();
          const rowsToInsert = allergens.map((a) => ({
            id: `${productId}_${a.allergenId}`,
            productId,
            allergenId: a.allergenId,
            type: a.type || "contains",
            createdAt: now,
            updatedAt: now,
          }));
          await trx("products_allergens").insert(rowsToInsert);
        }
      });

      // Queue VPS sync
      await syncProductAllergensToVPS(productId);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

