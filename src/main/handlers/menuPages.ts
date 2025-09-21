import { ipcMain } from "electron";
import { MenuPagesOperations } from "../database/menuPagesOperations.js";
import Logger from "electron-log";

export function setupMenuPagesHandlers() {
  // Get all menu pages
  ipcMain.handle("get-menu-pages", async (event, token) => {
    try {
      const menuPages = await MenuPagesOperations.getMenuPages();
      return { status: true, data: menuPages };
    } catch (error) {
      Logger.error("Error getting menu pages:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Get menu page by ID
  ipcMain.handle("get-menu-page-by-id", async (event, token, id) => {
    try {
      const menuPage = await MenuPagesOperations.getMenuPageById(id);
      if (!menuPage) {
        return { status: false, error: "Menu page not found" };
      }
      return { status: true, data: menuPage };
    } catch (error) {
      Logger.error("Error getting menu page by ID:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Create menu page
  ipcMain.handle("create-menu-page", async (event, token, menuPageData) => {
    try {
      const newMenuPage =
        await MenuPagesOperations.createMenuPage(menuPageData);
      return { status: true, data: newMenuPage };
    } catch (error) {
      Logger.error("Error creating menu page:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Update menu page
  ipcMain.handle("update-menu-page", async (event, token, id, updates) => {
    try {
      const updatedMenuPage = await MenuPagesOperations.updateMenuPage(
        id,
        updates
      );
      return { status: true, data: updatedMenuPage };
    } catch (error) {
      Logger.error("Error updating menu page:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Delete menu page
  ipcMain.handle("delete-menu-page", async (event, token, id) => {
    try {
      await MenuPagesOperations.deleteMenuPage(id);
      return { status: true, message: "Menu page deleted successfully" };
    } catch (error) {
      Logger.error("Error deleting menu page:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Add product to menu page
  ipcMain.handle(
    "add-product-to-menu-page",
    async (
      event,
      token,
      menuPageId,
      productId,
      productName,
      supplement = 0,
      priority = 0
    ) => {
      try {
        const menuPageProduct = await MenuPagesOperations.addProductToMenuPage(
          menuPageId,
          productId,
          productName,
          supplement,
          priority
        );
        return { status: true, data: menuPageProduct };
      } catch (error) {
        Logger.error("Error adding product to menu page:", error);
        return {
          status: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  // Get menu page products
  ipcMain.handle("get-menu-page-products", async (event, token, menuPageId) => {
    try {
      const products =
        await MenuPagesOperations.getMenuPageProducts(menuPageId);
      return { status: true, data: products };
    } catch (error) {
      Logger.error("Error getting menu page products:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Remove product from menu page
  ipcMain.handle(
    "remove-product-from-menu-page",
    async (event, token, menuPageId, productId) => {
      try {
        await MenuPagesOperations.removeProductFromMenuPage(
          menuPageId,
          productId
        );
        return {
          status: true,
          message: "Product removed from menu page successfully",
        };
      } catch (error) {
        Logger.error("Error removing product from menu page:", error);
        return {
          status: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  // Update menu page product
  ipcMain.handle(
    "update-menu-page-product",
    async (event, token, id, updates) => {
      try {
        const updatedProduct = await MenuPagesOperations.updateMenuPageProduct(
          id,
          updates
        );
        return { status: true, data: updatedProduct };
      } catch (error) {
        Logger.error("Error updating menu page product:", error);
        return {
          status: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );
}
