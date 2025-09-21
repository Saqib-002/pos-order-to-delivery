import { ipcMain } from "electron";
import { MenusOperations } from "../database/menusOperations.js";
import Logger from "electron-log";

export function setupMenusHandlers() {
  // Get all menus
  ipcMain.handle("get-menus", async (event, token) => {
    try {
      const menus = await MenusOperations.getMenus();
      return { status: true, data: menus };
    } catch (error) {
      Logger.error("Error getting menus:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Get menus by subcategory
  ipcMain.handle(
    "get-menus-by-subcategory",
    async (event, token, subcategoryId) => {
      try {
        const menus =
          await MenusOperations.getMenusBySubcategory(subcategoryId);
        return { status: true, data: menus };
      } catch (error) {
        Logger.error("Error getting menus by subcategory:", error);
        return {
          status: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  // Get menu by ID
  ipcMain.handle("get-menu-by-id", async (event, token, id) => {
    try {
      const menu = await MenusOperations.getMenuById(id);
      if (!menu) {
        return { status: false, error: "Menu not found" };
      }
      return { status: true, data: menu };
    } catch (error) {
      Logger.error("Error getting menu by ID:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Create menu
  ipcMain.handle("create-menu", async (event, token, menuData) => {
    try {
      const newMenu = await MenusOperations.createMenu(menuData);
      return { status: true, data: newMenu };
    } catch (error) {
      Logger.error("Error creating menu:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Update menu
  ipcMain.handle("update-menu", async (event, token, id, updates) => {
    try {
      const updatedMenu = await MenusOperations.updateMenu(id, updates);
      return { status: true, data: updatedMenu };
    } catch (error) {
      Logger.error("Error updating menu:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Delete menu
  ipcMain.handle("delete-menu", async (event, token, id) => {
    try {
      await MenusOperations.deleteMenu(id);
      return { status: true, message: "Menu deleted successfully" };
    } catch (error) {
      Logger.error("Error deleting menu:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Add menu page association
  ipcMain.handle(
    "add-menu-page-association",
    async (
      event,
      token,
      menuId,
      menuPageId,
      pageName,
      minimum = 1,
      maximum = 1,
      priority = 0,
      kitchenPriority = "Priority 1",
      multiple = "No"
    ) => {
      try {
        const association = await MenusOperations.addMenuPageAssociation(
          menuId,
          menuPageId,
          pageName,
          minimum,
          maximum,
          priority,
          kitchenPriority,
          multiple
        );
        return { status: true, data: association };
      } catch (error) {
        Logger.error("Error adding menu page association:", error);
        return {
          status: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  // Get menu page associations
  ipcMain.handle("get-menu-page-associations", async (event, token, menuId) => {
    try {
      const associations =
        await MenusOperations.getMenuPageAssociations(menuId);
      return { status: true, data: associations };
    } catch (error) {
      Logger.error("Error getting menu page associations:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Update menu page association
  ipcMain.handle(
    "update-menu-page-association",
    async (event, token, id, updates) => {
      try {
        const updatedAssociation =
          await MenusOperations.updateMenuPageAssociation(id, updates);
        return { status: true, data: updatedAssociation };
      } catch (error) {
        Logger.error("Error updating menu page association:", error);
        return {
          status: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  // Remove menu page association
  ipcMain.handle("remove-menu-page-association", async (event, token, id) => {
    try {
      await MenusOperations.removeMenuPageAssociation(id);
      return {
        status: true,
        message: "Menu page association removed successfully",
      };
    } catch (error) {
      Logger.error("Error removing menu page association:", error);
      return {
        status: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Remove all menu page associations for a menu
  ipcMain.handle(
    "remove-all-menu-page-associations",
    async (event, token, menuId) => {
      try {
        await MenusOperations.removeAllMenuPageAssociations(menuId);
        return {
          status: true,
          message: "All menu page associations removed successfully",
        };
      } catch (error) {
        Logger.error("Error removing all menu page associations:", error);
        return {
          status: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );
}
