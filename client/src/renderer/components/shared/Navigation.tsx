import { useEffect, useState, useRef } from "react";
import { navItems } from "@/constants";
import { DoubleBackArrowIcon } from "@/renderer/public/Svg";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { useTranslation } from "react-i18next";
import { hasModuleAccess } from "@/renderer/utils/permissions";
import { ArrowLeft } from "lucide-react";

export const Navigation = ({
  currentView,
  setView,
  userRole,
  userModulePermissions,
  onLogout,
  webAdminTab = "hero",
  setWebAdminTab,
}: {
  currentView: string;
  setView: (view: string) => void;
  userRole: string | undefined;
  userModulePermissions?: string[];
  onLogout: () => void;
  webAdminTab?: string;
  setWebAdminTab?: (tab: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const { configurations, setConfigurations } = useConfigurations();
  const {
    auth: { token },
  } = useAuth();
  const { t } = useTranslation();
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [visibleItemsCount, setVisibleItemsCount] = useState(10);

  const isWebAdmin = currentView === "web-admin";

  const accessibleNavItems = [
    ...navItems.filter(({ view, roles }) =>
      hasModuleAccess(view, userModulePermissions, userRole, roles),
    ),
    { view: "logout", roles: [] },
  ];

  const webAdminItems = [
    { key: "hero", label: t("webAdmin.tabs.hero"), icon: "./images/slider.png" },
    { key: "branding", label: t("webAdmin.branding.title", "Marca y Ajustes"), icon: "./images/branding.png" },
    { key: "notifications", label: t("webAdmin.notifications.title", "Notificaciones y Enlaces"), icon: "./images/notification.png" },
    { key: "footer", label: t("webAdmin.tabs.footer"), icon: "./images/footer.png" },
    { key: "about", label: t("webAdmin.tabs.about"), icon: "./images/about-us.png" },
    { key: "contact", label: t("webAdmin.tabs.contact"), icon: "./images/contact.png" },
    { key: "faq", label: t("webAdmin.tabs.faq"), icon: "./images/faq.png" },
    { key: "allergens", label: t("webAdmin.tabs.allergens"), icon: "./images/allergen.png" },
    { key: "terms", label: t("webAdmin.tabs.terms"), icon: "./images/terms-and-conditions.png" },
    { key: "privacy", label: t("webAdmin.tabs.privacy"), icon: "./images/privacy-policy.png" },
    { key: "customers", label: t("webAdmin.customers.title", "Clientes Web"), icon: "./images/web-customers.png" },
    { key: "support", label: t("webAdmin.support.title", "Soporte y Mensajes"), icon: "./images/support.png" },
  ];

  useEffect(() => {
    const calculateVisibleItems = () => {
      const headerHeight = 64;
      const itemHeight = 54;
      const scrollButtonsHeight = 100;

      const availableHeight = window.innerHeight - headerHeight;
      const totalItemsHeight = accessibleNavItems.length * itemHeight;

      if (totalItemsHeight <= availableHeight) {
        setVisibleItemsCount(accessibleNavItems.length);
      } else {
        const availableSpaceForItems = availableHeight - scrollButtonsHeight;
        const count = Math.floor(availableSpaceForItems / itemHeight);
        setVisibleItemsCount(Math.max(1, count));
      }
    };

    calculateVisibleItems();
    window.addEventListener("resize", calculateVisibleItems);

    return () => {
      window.removeEventListener("resize", calculateVisibleItems);
    };
  }, [accessibleNavItems.length]);

  const scrollUp = () => {
    setScrollPosition(Math.max(0, scrollPosition - 1));
  };
  const scrollDown = () => {
    const maxScroll = Math.max(
      0,
      accessibleNavItems.length - visibleItemsCount,
    );
    setScrollPosition(Math.min(maxScroll, scrollPosition + 1));
  };

  const canScrollUp = scrollPosition > 0;
  const canScrollDown =
    scrollPosition < Math.max(0, accessibleNavItems.length - visibleItemsCount);

  const [webAdminScrollPosition, setWebAdminScrollPosition] = useState(0);
  const webAdminVisibleCount = Math.max(1, visibleItemsCount - 2);

  const canWebAdminScrollUp = webAdminScrollPosition > 0;
  const canWebAdminScrollDown =
    webAdminScrollPosition < Math.max(0, webAdminItems.length - webAdminVisibleCount);

  const scrollWebAdminUp = () => {
    setWebAdminScrollPosition((prev) => Math.max(0, prev - 1));
  };
  const scrollWebAdminDown = () => {
    const maxScroll = Math.max(0, webAdminItems.length - webAdminVisibleCount);
    setWebAdminScrollPosition((prev) => Math.min(maxScroll, prev + 1));
  };

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

  useEffect(() => {
    setScrollPosition(0);
    setWebAdminScrollPosition(0);
  }, [isOpen, isWebAdmin]);

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
      vehicles: "./images/car-maintainence.png",
      workers: "./images/workers.png",
      "market-purchases": "./images/market-purchase.png",
      expenses: "./images/expense.png",
      "cash-out": "./images/cashout.png",
      "web-admin": "./images/admin-panel.png",
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
      "web-admin": t("navigation.webAdmin", "Admin Web y App"),
      vehicles: t("navigation.vehicles"),
      workers: t("navigation.workers"),
      "market-purchases": t("navigation.marketPurchases"),
      expenses: t("navigation.expenses"),
      "cash-out": t("navigation.cashout"),
    };
    return labelMap[view] || view;
  };

  const getVisibleItems = () => {
    if (isOpen) {
      return accessibleNavItems;
    }
    return accessibleNavItems.slice(
      scrollPosition,
      scrollPosition + visibleItemsCount,
    );
  };

  const visibleItems = getVisibleItems();

  const getVisibleWebAdminItems = () => {
    if (isOpen) {
      return webAdminItems;
    }
    return webAdminItems.slice(
      webAdminScrollPosition,
      webAdminScrollPosition + webAdminVisibleCount
    );
  };

  const visibleWebAdminItems = getVisibleWebAdminItems();

  const renderNavButton = (
    view: string,
    label: string,
    onClickOverride?: () => void,
    isPopover = false,
  ) => (
    <button
      key={view}
      className={`w-full flex items-center gap-3 p-2 text-left transition-colors duration-200 cursor-pointer mb-1
        ${currentView === view ? "bg-gray-300 text-black font-semibold" : "text-gray-700 hover:bg-gray-100"} 
        ${!isOpen && !isPopover ? "justify-center" : ""}
      `}
      onClick={
        onClickOverride ||
        (() => {
          setView(view);
          setIsOpen(false);
        })
      }
      title={!isOpen && !isPopover ? label : undefined}
    >
      <img
        src={getIcon(view)}
        alt={`${label} icon`}
        className="size-9 shrink-0 object-contain"
        onError={(e) => {
          e.currentTarget.src = "./images/order.png";
        }}
      />
      {(isOpen || isPopover) && (
        <span className="font-medium truncate">{label}</span>
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
                {isWebAdmin
                  ? t("webAdmin.title", "Admin Web y App")
                  : configurations.name
                  ? configurations.name
                  : t("navigation.defaultCompanyName")}
              </h1>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto cursor-pointer"
            title={isOpen ? "Contraer" : "Expandir"}
          >
            <DoubleBackArrowIcon
              className={`w-5 h-5 transition-transform duration-300 rotate-180 ${
                isOpen ? "rotate-360" : ""
              }`}
            />
          </button>
        </div>

        {/* Navigation Content */}
        {isWebAdmin ? (
          /* ── Web & App Admin Sub-Navigation Mode ── */
          <div className="flex-1 flex flex-col">
            {/* Back to POS Button */}
            <div className="shrink-0">
              <button
                onClick={() => {
                  setView("order");
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2 text-left transition-colors duration-200 cursor-pointer mb-1 text-gray-700 hover:bg-gray-100
                  ${!isOpen ? "justify-center" : ""}
                `}
                title={!isOpen ? t("navigation.backToPos", "Volver al TPV") : undefined}
              >
                <ArrowLeft className="w-6 h-6 shrink-0 text-gray-700" />
                {isOpen && (
                  <span className="font-medium truncate">
                    {t("navigation.backToPos", "Volver al TPV")}
                  </span>
                )}
              </button>
            </div>

            {/* Scroll Up Button (Collapsed Mode Only) */}
            {!isOpen && webAdminItems.length > webAdminVisibleCount && (
              <button
                onClick={scrollWebAdminUp}
                disabled={!canWebAdminScrollUp}
                className={`px-4 py-2 transition-colors shrink-0 ${
                  canWebAdminScrollUp
                    ? "text-gray-600 hover:bg-gray-100 cursor-pointer"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                title="Scroll Up"
              >
                <DoubleBackArrowIcon
                  className="ml-1 w-6 h-6 transition-transform cursor-pointer duration-300 rotate-90"
                />
              </button>
            )}

            {/* Web Admin Tabs */}
            <div
              className={`flex-1 py-0 flex flex-col ${
                isOpen
                  ? "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
                  : ""
              }`}
              style={isOpen ? { maxHeight: "calc(100vh - 140px)" } : {}}
            >
              {visibleWebAdminItems.map((item) => {
                const isActive = webAdminTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setWebAdminTab?.(item.key);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2 text-left transition-colors duration-200 cursor-pointer mb-1
                      ${
                        isActive
                          ? "bg-gray-300 text-black font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                      ${!isOpen ? "justify-center" : ""}
                    `}
                    title={!isOpen ? item.label : undefined}
                  >
                    <img
                      src={item.icon}
                      alt={`${item.label} icon`}
                      className="size-9 shrink-0 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "./images/order.png";
                      }}
                    />
                    {isOpen && (
                      <span className="font-medium truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scroll Down Button (Collapsed Mode Only) */}
            {!isOpen && webAdminItems.length > webAdminVisibleCount && (
              <button
                onClick={scrollWebAdminDown}
                disabled={!canWebAdminScrollDown}
                className={`px-4 py-2 transition-colors shrink-0 ${
                  canWebAdminScrollDown
                    ? "text-gray-600 hover:bg-gray-100 cursor-pointer"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                title="Scroll Down"
              >
                <DoubleBackArrowIcon
                  className="ml-1 w-6 h-6 transition-transform cursor-pointer duration-300 rotate-270"
                />
              </button>
            )}

            {/* Logout at bottom of Web Admin */}
            <div className="border-t border-gray-200 shrink-0">
              {renderNavButton(
                "logout",
                t("navigation.logout"),
                onLogout
              )}
            </div>
          </div>
        ) : (
          /* ── Standard Restaurant Navigation Mode ── */
          <div className="flex-1 flex flex-col">
            {/* Scroll Up Button (Collapsed Mode Only) */}
            {!isOpen && accessibleNavItems.length > visibleItemsCount && (
              <button
                onClick={scrollUp}
                disabled={!canScrollUp}
                className={`px-4 py-2 transition-colors ${
                  canScrollUp
                    ? "text-gray-600 hover:bg-gray-100 cursor-pointer"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                title="Scroll Up"
              >
                <DoubleBackArrowIcon
                  className={`ml-1 w-6 h-6 transition-transform cursor-pointer duration-300 rotate-90`}
                />
              </button>
            )}

            {/* Navigation Items */}
            <div
              ref={navContainerRef}
              className={`flex-1 py-0 flex flex-col ${
                isOpen
                  ? "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
                  : ""
              }`}
              style={isOpen ? { maxHeight: "calc(100vh - 80px)" } : {}}
            >
              {visibleItems.map(({ view }) =>
                renderNavButton(
                  view,
                  getTranslatedLabel(view),
                  view === "logout" ? onLogout : undefined,
                ),
              )}
            </div>

            {/* Scroll Down Button (Collapsed Mode Only) */}
            {!isOpen && accessibleNavItems.length > visibleItemsCount && (
              <button
                onClick={scrollDown}
                disabled={!canScrollDown}
                className={`px-4 py-2 transition-colors ${
                  canScrollDown
                    ? "text-gray-600 hover:bg-gray-100 cursor-pointer"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                title="Scroll Down"
              >
                <DoubleBackArrowIcon
                  className={`ml-1 w-6 h-6 transition-transform cursor-pointer duration-300 rotate-270`}
                />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Navigation;
