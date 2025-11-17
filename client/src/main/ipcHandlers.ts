import { ipcMain } from "electron";
import {
  addItemToOrder,
  deleteOrder,
  getOrderAnalytics,
  getOrderItems,
  getOrdersByFilter,
  removeItemFromOrder,
  removeMenuFromOrder,
  removeMenuItemFromOrder,
  saveOrder,
  updateItemQuantity,
  updateMenuQuantity,
  updateOrder,
  updateOrderItem,
  duplicateMenuInOrder,
  updateOrderItems,
} from "./handlers/orders.js";
import {
  deleteUser,
  getUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from "./handlers/auth.js";
import {
  assignDeliveryPersonToOrder,
  createDeliveryPerson,
  deleteDeliveryPerson,
  getDeliveryPersons,
  getDeliveryPersonStats,
  updateDeliveryPerson,
} from "./handlers/delivery.js";
import {
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  getCategories,
  getSubCategories,
  getAllSubCategories,
  updateCategory,
  updateSubCategory,
} from "./handlers/categories.js";
import {
  createVariant,
  deleteVariant,
  getAssociatedProductsByVariantId,
  getVariants,
  updateVariant,
} from "./handlers/variants.js";
import {
  createGroup,
  deleteGroup,
  getAttachProductsByGroupId,
  getGroups,
  updateGroup,
} from "./handlers/group.js";
import {
  createProduct,
  deleteProduct,
  getAddOnPagesByProductId,
  getAllProducts,
  getAssociatedMenuPagesByProductId,
  getProductById,
  getProductsByCatId,
  getVariantsByProductId,
  updateProduct,
  updateProductPriorities,
} from "./handlers/products.js";
import {
  createMenuPage,
  deleteMenuPage,
  getAssociatedMenuByMenuPageId,
  getMenuPageProducts,
  getMenuPages,
  updateMenuPage,
} from "./handlers/menuPages.js";
import {
  createMenu,
  deleteMenu,
  getMenuById,
  getMenuPageAssociations,
  getMenus,
  getMenusBySubcategory,
  updateMenu,
  updateMenuPriorities,
} from "./handlers/menus.js";
import {
  createCustomer,
  getCustomersByPhone,
  updateCustomer,
  getAllCustomers,
} from "./handlers/customers.js";
import {
  createPrinter,
  deletePrinter,
  getAllPrinters,
  getConnectedPrinters,
  getProductPrinters,
  printToPrinter,
  updatePrinter,
} from "./handlers/printers.js";
import {
  createConfigurations,
  getConfigurations,
  updateConfigurations,
} from "./handlers/configurations.js";
import Store from "electron-store";
import { initDatabase } from "./database/index.js";
interface DbCredentials {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}
interface StoreSchema {
  dbCredentials: DbCredentials;
}
const store = new Store<StoreSchema>({
  defaults: {
    dbCredentials: {
      host: "localhost",
      port: 5432,
      database: "restaurant_pos",
      user: "pos_admin",
      password: "",
    },
  },
});

export function registerIpcHandlers() {
  // db handlers
  ipcMain.handle("get-db-credentials", async () => {
    return store.get("dbCredentials");
  });
  ipcMain.handle(
    "save-and-init-db",
    async (event, credentials: DbCredentials) => {
      try {
        // 1. Try to initialize the database with the new credentials
        await initDatabase(credentials);

        // 2. If successful, save them to the store
        store.set("dbCredentials", credentials);

        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // categories handlers
  ipcMain.handle("create-category", createCategory);
  ipcMain.handle("get-categories", getCategories);
  ipcMain.handle("delete-category", deleteCategory);
  ipcMain.handle("update-category", updateCategory);
  // sub-categories handlers
  ipcMain.handle("create-sub-category", createSubCategory);
  ipcMain.handle("get-sub-categories", getSubCategories);
  ipcMain.handle("get-all-sub-categories", getAllSubCategories);
  ipcMain.handle("delete-sub-category", deleteSubCategory);
  ipcMain.handle("update-sub-category", updateSubCategory);
  // variants handlers
  ipcMain.handle("create-variant", createVariant);
  ipcMain.handle("get-variants", getVariants);
  ipcMain.handle("delete-variant", deleteVariant);
  ipcMain.handle("update-variant", updateVariant);
  ipcMain.handle(
    "get-associated-products-by-variant-id",
    getAssociatedProductsByVariantId
  );
  // groups handlers
  ipcMain.handle("create-group", createGroup);
  ipcMain.handle("get-groups", getGroups);
  ipcMain.handle("delete-group", deleteGroup);
  ipcMain.handle("update-group", updateGroup);
  ipcMain.handle("get-attach-products-by-group-id", getAttachProductsByGroupId);

  // product handlers
  ipcMain.handle("create-product", createProduct);
  ipcMain.handle("get-all-products", getAllProducts);
  ipcMain.handle("get-products-by-cat-id", getProductsByCatId);
  ipcMain.handle("update-product", updateProduct);
  ipcMain.handle("delete-product", deleteProduct);
  ipcMain.handle("get-variants-by-product-id", getVariantsByProductId);
  ipcMain.handle("get-add-on-pages-by-product-id", getAddOnPagesByProductId);
  ipcMain.handle("get-product-by-id", getProductById);
  ipcMain.handle(
    "get-associated-menu-pages-by-product-id",
    getAssociatedMenuPagesByProductId
  );
  ipcMain.handle("update-product-priorities", updateProductPriorities);

  // Customer handlers
  ipcMain.handle("create-customer", createCustomer);
  ipcMain.handle("get-customers-by-phone", getCustomersByPhone);
  ipcMain.handle("get-all-customers", getAllCustomers);
  ipcMain.handle("upsert-customer", updateCustomer);

  // Menu Pages handlers
  ipcMain.handle("create-menu-page", createMenuPage);
  ipcMain.handle("get-menu-pages", getMenuPages);
  ipcMain.handle("update-menu-page", updateMenuPage);
  ipcMain.handle("delete-menu-page", deleteMenuPage);
  ipcMain.handle("get-menu-page-products", getMenuPageProducts);
  ipcMain.handle(
    "get-associated-menu-by-menu-page-id",
    getAssociatedMenuByMenuPageId
  );

  // Menus handlers
  ipcMain.handle("create-menu", createMenu);
  ipcMain.handle("get-menus", getMenus);
  ipcMain.handle("get-menus-by-subcategory", getMenusBySubcategory);
  ipcMain.handle("get-menu-by-id", getMenuById);
  ipcMain.handle("update-menu", updateMenu);
  ipcMain.handle("delete-menu", deleteMenu);
  ipcMain.handle("update-menu-priorities", updateMenuPriorities);
  ipcMain.handle("get-menu-page-associations", getMenuPageAssociations);

  // Authentication handlers
  ipcMain.handle("register-user", registerUser);
  ipcMain.handle("login-user", loginUser);
  ipcMain.handle("logout-user", logoutUser);
  ipcMain.handle("get-users", getUsers);
  ipcMain.handle("update-user", updateUser);
  ipcMain.handle("delete-user", deleteUser);

  // Order handlers (with same authorization logic)
  ipcMain.handle("save-order", saveOrder);
  ipcMain.handle("add-item-to-order", addItemToOrder);
  ipcMain.handle("remove-item-from-order", removeItemFromOrder);
  ipcMain.handle("remove-menu-from-order", removeMenuFromOrder);
  ipcMain.handle("remove-menu-item-from-order", removeMenuItemFromOrder);
  ipcMain.handle("delete-order", deleteOrder);
  ipcMain.handle("update-item-quantity", updateItemQuantity);
  ipcMain.handle("update-menu-quantity", updateMenuQuantity);
  ipcMain.handle("update-order-item", updateOrderItem);
  ipcMain.handle("update-order-items", updateOrderItems);
  ipcMain.handle("get-order-items", getOrderItems);
  ipcMain.handle("update-order", updateOrder);
  ipcMain.handle("get-order-analytics", getOrderAnalytics);
  ipcMain.handle("get-orders-by-filter", getOrdersByFilter);
  ipcMain.handle("duplicate-menu-in-order", duplicateMenuInOrder);

  // delivery person handlers
  ipcMain.handle("create-delivery-person", createDeliveryPerson);
  ipcMain.handle("get-delivery-persons", getDeliveryPersons);
  ipcMain.handle("get-delivery-person-stats", getDeliveryPersonStats);
  ipcMain.handle("update-delivery-person", updateDeliveryPerson);
  ipcMain.handle("delete-delivery-person", deleteDeliveryPerson);
  ipcMain.handle("assign-delivery-person", assignDeliveryPersonToOrder);

  // printers
  ipcMain.handle("get-connected-printers", getConnectedPrinters);
  ipcMain.handle("create-printer", createPrinter);
  ipcMain.handle("update-printer", updatePrinter);
  ipcMain.handle("delete-printer", deletePrinter);
  ipcMain.handle("get-all-printers", getAllPrinters);
  ipcMain.handle("get-product-printers", getProductPrinters);
  ipcMain.handle("print-to-printer", printToPrinter);

  // configurations
  ipcMain.handle("create-configurations", createConfigurations);
  ipcMain.handle("get-configurations", getConfigurations);
  ipcMain.handle("update-configurations", updateConfigurations);
}
