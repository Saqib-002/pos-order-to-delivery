import { IpcMainInvokeEvent } from "electron";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";
import {
  CategoryDatabaseOperations,
  SubCategoriesOperations,
} from "../database/categoriesOperations.js";
import {
  syncCategoryToVPS,
  deleteCategoryFromVPS,
  syncSubCategoryToVPS,
  deleteSubCategoryFromVPS,
} from "../utils/sync/index.js";
export const createCategory = async (
  event: IpcMainInvokeEvent,
  token: string,
  category: any
) => {
  try {
    await verifyToken(event, token);
    const result = await CategoryDatabaseOperations.createCategory(category);
    syncCategoryToVPS(result.newCategory.id);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error creating category:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
export const getCategories = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result = await CategoryDatabaseOperations.getCategories();
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error getting categories:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
export const deleteCategory = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string
) => {
  try {
    await verifyToken(event, token);
    // Fire VPS delete first while id is still known
    deleteCategoryFromVPS(id);
    const result = await CategoryDatabaseOperations.deleteCategory(id);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error(`Error deleting category ${id}:`, error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
export const updateCategory = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string,
  updates: any
) => {
  try {
    await verifyToken(event, token);
    const result = await CategoryDatabaseOperations.updateCategory(id, updates);
    syncCategoryToVPS(id);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error(`Error updating category ${id}:`, error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
export const createSubCategory = async (
  event: IpcMainInvokeEvent,
  token: string,
  subCategory: any
) => {
  try {
    await verifyToken(event, token);
    const result = await SubCategoriesOperations.createSubCategory(subCategory);
    syncSubCategoryToVPS(result.id);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error creating subcategory:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
export const getSubCategories = async (
  event: IpcMainInvokeEvent,
  token: string,
  categoryId: string,
  isForOrder: boolean = false
) => {
  try {
    await verifyToken(event, token);
    const result = await SubCategoriesOperations.getSubCategories(categoryId, isForOrder);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error getting subcategories:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
export const getAllSubCategories = async (
  event: IpcMainInvokeEvent,
  token: string
) => {
  try {
    await verifyToken(event, token);
    const result = await SubCategoriesOperations.getAllSubCategories();
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error("Error getting all subcategories:", error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
export const deleteSubCategory = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string
) => {
  try {
    await verifyToken(event, token);
    // Fire VPS delete first while id is still known
    deleteSubCategoryFromVPS(id);
    const result = await SubCategoriesOperations.deleteSubCategory(id);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error(`Error deleting subcategory ${id}:`, error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
export const updateSubCategory = async (
  event: IpcMainInvokeEvent,
  token: string,
  id: string,
  updates: any
) => {
  try {
    await verifyToken(event, token);
    const result = await SubCategoriesOperations.updateSubCategory(id, updates);
    syncSubCategoryToVPS(id);
    return {
      status: true,
      data: result,
    };
  } catch (error) {
    Logger.error(`Error updating subcategory ${id}:`, error);
    return {
      status: false,
      error: (error as Error).message,
    };
  }
};
