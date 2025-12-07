export const TOAST_DEBOUNCE_MS = 1000;
export const NOTIFICATION_VOLUME = 0.5;
export const VIEWS = {
  LOGIN: "login",
  ORDER: "order",
  KITCHEN: "kitchen",
  DELIVERY: "delivery",
  DELIVERY_MANAGEMENT: "delivery-management",
  MANAGE_ORDERS: "manage-orders",
  PLATFORM_ORDERS: "platform-orders",
  REPORTS: "reports",
  USERS: "users",
  CUSTOMERS: "customers",
  MENU_STRUCTURE: "menu-structure",
  CONFIGURATIONS: "configurations",
} as const;

export const navItems = [
  {
    view: VIEWS.ORDER,
    label: "Orders",
    roles: ["admin", "staff", "kitchen", "manager"],
  },
  { view: VIEWS.KITCHEN, label: "Kitchen View", roles: ["admin"] },
  { view: VIEWS.DELIVERY, label: "Delivery View", roles: ["admin"] },
  {
    view: VIEWS.DELIVERY_MANAGEMENT,
    label: "Delivery Management",
    roles: ["admin"],
  },
  { view: VIEWS.MANAGE_ORDERS, label: "Manage Orders", roles: ["admin"] },
  { view: VIEWS.PLATFORM_ORDERS, label: "Platform Orders", roles: ["admin"] },
  { view: VIEWS.REPORTS, label: "Reports", roles: ["admin"] },
  { view: VIEWS.MENU_STRUCTURE, label: "Menu Structure", roles: ["admin"] },
  { view: VIEWS.USERS, label: "Users", roles: ["admin"] },
  { view: VIEWS.CUSTOMERS, label: "Customers", roles: ["admin"] },
  { view: VIEWS.CONFIGURATIONS, label: "Configurations", roles: ["admin"] },
];

export const MENU_CATEGORIES = {
  BURGERS: "burgers",
  PIZZA: "pizza",
  DRINKS: "drinks",
  DESSERTS: "desserts",
  APPETIZERS: "appetizers",
  SALADS: "salads",
  PASTA: "pasta",
  SANDWICHES: "sandwiches",
} as const;

export const CATEGORY_LABELS = {
  [MENU_CATEGORIES.BURGERS]: "Burgers",
  [MENU_CATEGORIES.PIZZA]: "Pizza",
  [MENU_CATEGORIES.DRINKS]: "Drinks",
  [MENU_CATEGORIES.DESSERTS]: "Desserts",
  [MENU_CATEGORIES.APPETIZERS]: "Appetizers",
  [MENU_CATEGORIES.SALADS]: "Salads",
  [MENU_CATEGORIES.PASTA]: "Pasta",
  [MENU_CATEGORIES.SANDWICHES]: "Sandwiches",
} as const;
export const DEFAULT_PAGE_LIMIT = 25;

// Module Permissions Configuration
export const MODULES = {
  ORDER: "order",
  KITCHEN: "kitchen",
  DELIVERY: "delivery",
  DELIVERY_MANAGEMENT: "delivery-management",
  MANAGE_ORDERS: "manage-orders",
  PLATFORM_ORDERS: "platform-orders",
  REPORTS: "reports",
  MENU_STRUCTURE: "menu-structure",
  USERS: "users",
  CUSTOMERS: "customers",
  CONFIGURATIONS: "configurations",
} as const;

export const MODULE_LABELS = {
  [MODULES.ORDER]: "Orders",
  [MODULES.KITCHEN]: "Kitchen View",
  [MODULES.DELIVERY]: "Delivery View",
  [MODULES.DELIVERY_MANAGEMENT]: "Delivery Management",
  [MODULES.MANAGE_ORDERS]: "Manage Orders",
  [MODULES.PLATFORM_ORDERS]: "Platform Orders",
  [MODULES.REPORTS]: "Reports",
  [MODULES.MENU_STRUCTURE]: "Menu Structure",
  [MODULES.USERS]: "Users",
  [MODULES.CUSTOMERS]: "Customers",
  [MODULES.CONFIGURATIONS]: "Configurations",
} as const;

export const AVAILABLE_MODULES = Object.values(MODULES) as string[];

export const FUNCTIONS = {
  CANCEL_ORDER: "cancel-order",
  CHANGE_DELIVERY_PERSON: "change-delivery-person",
} as const;

export const FUNCTION_LABELS = {
  [FUNCTIONS.CANCEL_ORDER]: "Cancel Order",
  [FUNCTIONS.CHANGE_DELIVERY_PERSON]: "Change Delivery Person",
} as const;

// Available functions for permission management
export const AVAILABLE_FUNCTIONS = Object.values(FUNCTIONS) as string[];
