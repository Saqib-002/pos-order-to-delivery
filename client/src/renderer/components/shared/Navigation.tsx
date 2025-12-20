import { useEffect, useState, useRef } from "react";
import { navItems } from "@/constants";
import { NavItem } from "@/types/view";
import { DoubleBackArrowIcon } from "@/renderer/public/Svg";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { useTranslation } from "react-i18next";
import { hasModuleAccess } from "@/renderer/utils/permissions";

// Simple 3-dots icon for the "More" button
const MoreIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 10C4.9 10 4 10.9 4 12C4 13.1 4.9 14 6 14C7.1 14 8 13.1 8 12C8 10.9 7.1 10 6 10ZM18 10C16.9 10 16 10.9 16 12C16 13.1 16.9 14 18 14C19.1 14 20 13.1 20 12C20 10.9 19.1 10 18 10ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z" />
  </svg>
);

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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { configurations, setConfigurations } = useConfigurations();
  const { auth: { token } } = useAuth();
  const { t } = useTranslation();
  
  // Ref for handling clicks outside the popover
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Constants
  const VISIBLE_ITEM_LIMIT = 10; 

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
    
    // Close more menu on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      "platform-orders": "./images/platform.png",
      customers: "./images/customer.png",
      configurations: "./images/configuration.png",
      logout: "./images/logout.png",
      vehicles: "./images/delivery-truck.png",
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
      "platform-orders": t("navigation.platformOrders"),
      users: t("navigation.users"),
      customers: t("navigation.customers"),
      configurations: t("navigation.configurations"),
      vehicles: "Vehicles",
    };
    return labelMap[view] || view;
  };

  // Filter items first
  const accessibleNavItems = navItems.filter(({ view, roles }) => 
    hasModuleAccess(view, userModulePermissions, userRole, roles)
  );

  // Split into visible and hidden
  const visibleItems = accessibleNavItems.slice(0, VISIBLE_ITEM_LIMIT);
  const hiddenItems = accessibleNavItems.slice(VISIBLE_ITEM_LIMIT);
  const hasHiddenItems = hiddenItems.length > 0;

  // Helper to render a single nav button
  const renderNavButton = (view: string, label: string, onClickOverride?: () => void, isPopover = false) => (
    <button
      key={view}
      className={`w-full flex items-center gap-3 p-2 text-left transition-colors duration-200 cursor-pointer mb-1
        ${currentView === view ? "bg-gray-300 text-black" : "text-gray-700 hover:bg-gray-100"} 
        ${!isOpen && !isPopover ? "justify-center" : ""}
      `}
      onClick={onClickOverride || (() => {
        setView(view);
        setIsOpen(false);
        setShowMoreMenu(false);
      })}
      title={(!isOpen && !isPopover) ? label : undefined}
    >
      <img
        src={getIcon(view)}
        alt={`${label} icon`}
        className="size-9 flex-shrink-0 object-contain"
        onError={(e) => {
           e.currentTarget.src = "./images/order.png";
        }}
      />
      {(isOpen || isPopover) && (
        <span className="font-medium truncate">
          {label}
        </span>
      )}
    </button>
  );

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-all duration-300 flex flex-col ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 shrink-0 h-16">
          {isOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                crossOrigin="anonymous"
                src={configurations.logo ? configurations.logo : "./logo.png"}
                alt="Logo"
                className="size-6 object-contain"
              />
              <h1 className="text-lg font-bold text-gray-800 truncate">
                {configurations.name ? configurations.name : t("navigation.defaultCompanyName")}
              </h1>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
          >
            <DoubleBackArrowIcon
              className={`w-5 h-5 transition-transform cursor-pointer duration-300 rotate-180 ${isOpen ? "rotate-360" : ""}`}
            />
          </button>
        </div>

        {/* Visible Navigation Items */}
        <div className="flex-1 py-4 flex flex-col gap-1">
          {visibleItems.map(({ view }) => 
            renderNavButton(view, getTranslatedLabel(view))
          )}

          {/* More Button (Shown if there are hidden items) */}
          {hasHiddenItems && (
            <div className="relative" ref={moreMenuRef}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-200 cursor-pointer rounded-lg text-gray-700 hover:bg-gray-100
                  ${!isOpen ? "justify-center" : ""}
                  ${showMoreMenu ? "bg-gray-200" : ""}
                `}
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                title={!isOpen ? "More" : undefined}
              >
                 <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-gray-600">
                    <MoreIcon className="w-6 h-6" />
                 </div>
                 {isOpen && <span className="font-medium">More</span>}
              </button>

              {/* Popover Menu for Hidden Items AND Logout */}
              {showMoreMenu && (
                <div 
                  className={`absolute bottom-0 bg-white shadow-xl rounded-lg border border-gray-200 p-2 w-56 z-50
                    ${isOpen ? "left-full ml-2" : "left-full ml-4"}
                  `}
                  style={{ bottom: '0px' }}
                >
                  <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
                     {/* Hidden Views */}
                     {hiddenItems.map(({ view }) => 
                        renderNavButton(view, getTranslatedLabel(view), undefined, true)
                     )}
                     
                     {/* Divider */}
                     <div className="border-t border-gray-100 my-1"></div>

                     {/* Logout Button (Moved here) */}
                     {renderNavButton("logout", t("navigation.logout"), onLogout, true)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Logout Button (ONLY if NO hidden items) */}
        {!hasHiddenItems && (
          <div className="p-2 border-t border-gray-100 shrink-0">
             {renderNavButton("logout", t("navigation.logout"), onLogout)}
          </div>
        )}
      </div>
    </>
  );
};