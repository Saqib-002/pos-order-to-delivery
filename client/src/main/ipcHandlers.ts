import { ipcMain } from "electron";
import {
  addItemToOrder,
  deleteOrder,
  getOrderAnalytics,
  getOrderItems,
  getOrdersByFilter,
  getOrdersCountByStatus,
  createPlatformOrder,
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
  getCustomerByPhone,
  updateCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomerById,
  deleteCustomer,
} from "./handlers/customers.js";
import {
  createPrinter,
  deletePrinter,
  getAllPrinters,
  getConnectedPrinters,
  getProductPrinters,
  printToPrinter,
  updatePrinter,
  saveMaintenanceReportPDF,
  saveSalaryReportPDF,
  savePDFReport,
} from "./handlers/printers.js";
import {
  createPlatform,
  deletePlatform,
  getAllPlatforms,
  getPlatformById,
  updatePlatform,
} from "./handlers/platforms.js";
import {
  createConfigurations,
  getConfigurations,
  updateConfigurations,
} from "./handlers/configurations.js";
import {
  createVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
  addVehicleMaintenance,
  getVehicleMaintenance,
  deleteVehicleMaintenance,
  updateVehicleMaintenance,
} from "./handlers/vehicles.js";
import Store from "electron-store";
import { initDatabase } from "./database/index.js";
import {
  createWorker,
  getWorkers,
  updateWorker,
  deleteWorker,
  addSalaryRecord,
  getSalaryRecords,
  deleteSalaryRecord,
  updateSalaryRecord,
  addPaymentTransaction,
  addMultiplePaymentTransactions,
  updatePaymentTransaction,
  getPaymentTransactions,
  deletePaymentTransaction,
  getTotalPaidForSalary,
} from "./handlers/workers.js";
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getAllSuppliers,
  getSupplierById,
} from "./handlers/suppliers.js";
import {
  createExpenseType,
  updateExpenseType,
  deleteExpenseType,
  getAllExpenseTypes,
  getExpenseTypeById,
} from "./handlers/expenseTypes.js";
import {
  createInventoryProduct,
  updateInventoryProduct,
  deleteInventoryProduct,
  getAllInventoryProducts,
  getInventoryProductById,
  getInventoryProductsByExpenseType,
} from "./handlers/inventoryProducts.js";
import {
  createMarketPurchase,
  updateMarketPurchase,
  deleteMarketPurchase,
  getAllMarketPurchases,
  getMarketPurchaseById,
} from "./handlers/marketPurchases.js";
import {
  createOtherIncome,
  deleteOtherIncome,
  getAllOtherIncomes,
  getOtherIncomeById,
  updateOtherIncome,
} from "./handlers/OtherIncome.js";
import { getFinancialAnalytics } from "./handlers/financialOperations.js";
interface DbCredentials {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}
interface StoreSchema {
  dbCredentials: DbCredentials;
  cdnUrl: string;
}
const store = new Store<StoreSchema>({
  defaults: {
    dbCredentials: {
      host: "localhost",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: "",
    },
    cdnUrl: "http://192.168.1.0:3000",
  },
});

export function registerIpcHandlers() {
  // db handlers
  ipcMain.handle("get-db-credentials", async () => {
    return (store as any).get("dbCredentials");
  });
  // cdn handlers
  ipcMain.handle("get-cdn-url", async () => {
    return (store as any).get("cdnUrl");
  });
  ipcMain.handle("save-cdn-url", async (event, url: string) => {
    (store as any).set("cdnUrl", url);
    return true;
  });

  ipcMain.handle("get-google-maps-api-key", async () => {
    return (
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      ""
    );
  });
  ipcMain.handle(
    "save-and-init-db",
    async (event, credentials: DbCredentials) => {
      try {
        // 1. Try to initialize the database with the new credentials
        await initDatabase(credentials);

        // 2. If successful, save them to the store
        (store as any).set("dbCredentials", credentials);

        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );
  // Vehicle handlers
  ipcMain.handle("create-vehicle", createVehicle);
  ipcMain.handle("get-vehicles", getVehicles);
  ipcMain.handle("update-vehicle", updateVehicle);
  ipcMain.handle("delete-vehicle", deleteVehicle);
  ipcMain.handle("add-vehicle-maintenance", addVehicleMaintenance);
  ipcMain.handle("update-vehicle-maintenance", updateVehicleMaintenance);
  ipcMain.handle("delete-vehicle-maintenance", deleteVehicleMaintenance);
  ipcMain.handle("get-vehicle-maintenance", getVehicleMaintenance);
  // Worker handlers
  ipcMain.handle("create-worker", createWorker);
  ipcMain.handle("get-workers", getWorkers);
  ipcMain.handle("update-worker", updateWorker);
  ipcMain.handle("delete-worker", deleteWorker);

  // Salary handlers
  ipcMain.handle("add-salary-record", addSalaryRecord);
  ipcMain.handle("get-salary-records", getSalaryRecords);
  ipcMain.handle("delete-salary-record", deleteSalaryRecord);
  ipcMain.handle("update-salary-record", updateSalaryRecord);

  // Payment Transaction handlers
  ipcMain.handle("add-payment-transaction", addPaymentTransaction);
  ipcMain.handle(
    "add-multiple-payment-transactions",
    addMultiplePaymentTransactions
  );
  ipcMain.handle("update-payment-transaction", updatePaymentTransaction);
  ipcMain.handle("get-payment-transactions", getPaymentTransactions);
  ipcMain.handle("delete-payment-transaction", deletePaymentTransaction);
  ipcMain.handle("get-total-paid-for-salary", getTotalPaidForSalary);
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
  ipcMain.handle("get-customer-by-phone", getCustomerByPhone);
  ipcMain.handle("get-all-customers", getAllCustomers);
  ipcMain.handle("get-customer-by-id", getCustomerById);
  ipcMain.handle("upsert-customer", updateCustomer);
  ipcMain.handle("update-customer-by-id", updateCustomerById);
  ipcMain.handle("delete-customer", deleteCustomer);

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
  ipcMain.handle("get-orders-by-filter", getOrdersByFilter);
  ipcMain.handle("get-orders-count-by-status", getOrdersCountByStatus);
  ipcMain.handle("duplicate-menu-in-order", duplicateMenuInOrder);
  ipcMain.handle("create-platform-order", createPlatformOrder);
  // reports
  ipcMain.handle("get-order-analytics", getOrderAnalytics);
  ipcMain.handle("get-financial-analytics", getFinancialAnalytics);

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
  ipcMain.handle("save-maintenance-report-pdf", saveMaintenanceReportPDF);
  ipcMain.handle("save-salary-report-pdf", saveSalaryReportPDF);
  ipcMain.handle("save-pdf-report", savePDFReport);

  // platforms
  ipcMain.handle("create-platform", createPlatform);
  ipcMain.handle("update-platform", updatePlatform);
  ipcMain.handle("delete-platform", deletePlatform);
  ipcMain.handle("get-all-platforms", getAllPlatforms);
  ipcMain.handle("get-platform-by-id", getPlatformById);

  // configurations
  ipcMain.handle("create-configurations", createConfigurations);
  ipcMain.handle("get-configurations", getConfigurations);
  ipcMain.handle("update-configurations", updateConfigurations);

  // suppliers
  ipcMain.handle("create-supplier", createSupplier);
  ipcMain.handle("update-supplier", updateSupplier);
  ipcMain.handle("delete-supplier", deleteSupplier);
  ipcMain.handle("get-all-suppliers", getAllSuppliers);
  ipcMain.handle("get-supplier-by-id", getSupplierById);

  // expense types
  ipcMain.handle("create-expense-type", createExpenseType);
  ipcMain.handle("update-expense-type", updateExpenseType);
  ipcMain.handle("delete-expense-type", deleteExpenseType);
  ipcMain.handle("get-all-expense-types", getAllExpenseTypes);
  ipcMain.handle("get-expense-type-by-id", getExpenseTypeById);

  // inventory products
  ipcMain.handle("create-inventory-product", createInventoryProduct);
  ipcMain.handle("update-inventory-product", updateInventoryProduct);
  ipcMain.handle("delete-inventory-product", deleteInventoryProduct);
  ipcMain.handle("get-all-inventory-products", getAllInventoryProducts);
  ipcMain.handle("get-inventory-product-by-id", getInventoryProductById);
  ipcMain.handle(
    "get-inventory-products-by-expense-type",
    getInventoryProductsByExpenseType
  );

  // other incomes
  ipcMain.handle("create-other-income", createOtherIncome);
  ipcMain.handle("update-other-income", updateOtherIncome);
  ipcMain.handle("delete-other-income", deleteOtherIncome);
  ipcMain.handle("get-all-other-incomes", getAllOtherIncomes);
  ipcMain.handle("get-other-income-by-id", getOtherIncomeById);
  // market purchases
  ipcMain.handle("create-market-purchase", createMarketPurchase);
  ipcMain.handle("update-market-purchase", updateMarketPurchase);
  ipcMain.handle("delete-market-purchase", deleteMarketPurchase);
  ipcMain.handle("get-all-market-purchases", getAllMarketPurchases);
  ipcMain.handle("get-market-purchase-by-id", getMarketPurchaseById);
}
