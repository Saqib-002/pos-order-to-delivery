import { useEffect, useState } from "react";
import { navItems } from "@/constants";
import { NavItem } from "@/types/view";
import { DoubleBackArrowIcon } from "@/renderer/public/Svg";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { useTranslation } from "react-i18next";
import { hasModuleAccess } from "@/renderer/utils/permissions";

export const Navigation = ({
  currentView,
  setView,
  userRole,
  userModulePermissions,
  onLogout,
}: {
  currentView: string;
  setView: (view: string) => void;
  userRole: string | undefined;
  userModulePermissions?: string[];
  onLogout: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { configurations, setConfigurations } = useConfigurations();
  const {
    auth: { token },
  } = useAuth();
  const { t } = useTranslation();
  const getConfigurations = async () => {
    const res = await (window as any).electronAPI.getConfigurations(token);
    if (!res.status) {
      toast.error("Error getting configurations");
      return;
    }
    if (res.data) {
      setConfigurations(res.data);
    }
  };
  useEffect(() => {
    getConfigurations();
  }, []);

  const getIcon = (view: string) => {
    const iconMap: { [key: string]: string } = {
      order: "./images/order.png",
      kitchen: "./images/kitchen.png",
      delivery: "./images/delivery-bike.png",
      "delivery-management": "./images/driving-management.png",
      "manage-orders": "./images/order-management.png",
      reports: "./images/reports.png",
      "menu-structure": "./images/menu-structure.png",
      users: "./images/users.png",
      customers: "./images/customer.png",
      configurations: "./images/configuration.png",
      logout: "./images/logout.png",
    };

    return iconMap[view] || "./images/order.png";
  };

  const getTranslatedLabel = (view: string) => {
    const labelMap: { [key: string]: string } = {
      order: t("navigation.orders"),
      kitchen: t("navigation.kitchenView"),
      delivery: t("navigation.deliveryView"),
      "delivery-management": t("navigation.deliveryManagement"),
      "manage-orders": t("navigation.manageOrders"),
      reports: t("navigation.reports"),
      "menu-structure": t("navigation.menuStructure"),
      users: t("navigation.users"),
      customers: t("navigation.customers"),
      configurations: t("navigation.configurations"),
    };

    return labelMap[view] || view;
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ${
          isOpen ? "w-64" : "w-15"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          {isOpen && (
            <div className="flex items-center gap-2">
              <img
                crossOrigin="anonymous"
                src={configurations.logo ? configurations.logo : "./logo.png"}
                alt="Logo"
                className="size-6"
              />
              <h1 className="text-lg font-bold text-gray-800">
                {configurations.name
                  ? configurations.name
                  : t("navigation.defaultCompanyName")}
              </h1>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <DoubleBackArrowIcon
              className={`w-5 h-5 transition-transform duration-300 rotate-180 ${isOpen ? "rotate-360" : ""}`}
            />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-4">
          {navItems.map(({ view, label, roles }: NavItem) =>
            hasModuleAccess(view, userModulePermissions, userRole, roles) ? (
              <button
                key={view}
                className={`w-full flex items-center gap-3 px-2 py-2 text-left transition-colors duration-200 ${
                  currentView === view
                    ? "bg-gray-300 text-black"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setView(view);
                  setIsOpen(false);
                }}
                title={!isOpen ? getTranslatedLabel(view) : undefined}
              >
                <img
                  src={getIcon(view)}
                  alt={`${label} icon`}
                  className="w-10 h-10 flex-shrink-0"
                />
                {isOpen && (
                  <span className="font-medium truncate">
                    {getTranslatedLabel(view)}
                  </span>
                )}
              </button>
            ) : null
          )}
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-4 -left-1">
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${
              !isOpen ? "justify-center" : ""
            }`}
            onClick={onLogout}
            title={!isOpen ? t("navigation.logout") : undefined}
          >
            <img
              src={getIcon("logout")}
              alt="Logout icon"
              className="w-10 h-10 flex-shrink-0"
              onError={(e) => {
                console.log("Logout icon failed to load, trying fallback");
                e.currentTarget.src = "./images/order.png";
              }}
            />
            {isOpen && (
              <span className="font-medium">{t("navigation.logout")}</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
