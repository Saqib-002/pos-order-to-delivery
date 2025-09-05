export const TOAST_DEBOUNCE_MS = 1000;
export const NOTIFICATION_VOLUME = 0.5;
export const VIEWS = {
  LOGIN: "login",
  ORDER: "order",
  KITCHEN: "kitchen",
  DELIVERY: "delivery",
  REPORTS: "reports",
  USERS: "users",
  MENU: "menu",
} as const;

export const navItems = [
  { view: VIEWS.ORDER, label: "Orders" },
  { view: VIEWS.KITCHEN, label: "Kitchen View" },
  { view: VIEWS.DELIVERY, label: "Delivery View" },
  { view: VIEWS.REPORTS, label: "Reports" },
  { view: VIEWS.MENU, label: "Menu" },
  { view: VIEWS.USERS, label: "Users", adminOnly: true },
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
