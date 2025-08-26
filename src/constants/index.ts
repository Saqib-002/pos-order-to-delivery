export const TOAST_DEBOUNCE_MS = 1000;
export const NOTIFICATION_VOLUME = 0.5;
export const VIEWS = {
  LOGIN: "login",
  ORDER: "order",
  KITCHEN: "kitchen",
  DELIVERY: "delivery",
  REPORTS: "reports",
  USERS: "users",
} as const;

export const navItems = [
  { view: VIEWS.ORDER, label: "Orders" },
  { view: VIEWS.KITCHEN, label: "Kitchen View" },
  { view: VIEWS.DELIVERY, label: "Delivery View" },
  { view: VIEWS.REPORTS, label: "Reports" },
  { view: VIEWS.USERS, label: "Users", adminOnly: true },
];
