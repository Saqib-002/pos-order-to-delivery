import { useEffect, useState } from "react";
import { navItems } from "@/constants";
import { NavItem } from "@/types/view";
import { DoubleBackArrowIcon } from "@/renderer/assets/Svg";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useConfigurations } from "@/renderer/contexts/configurationContext";

export const Navigation = ({
  currentView,
  setView,
  userRole,
  onLogout,
}: {
  currentView: string;
  setView: (view: string) => void;
  userRole: string | undefined;
  onLogout: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { configurations, setConfigurations } = useConfigurations();
  const { auth: { token } } = useAuth();
  const getConfigurations = async () => {
    const res = await (window as any).electronAPI.getConfigurations(token);
    if (!res.status) {
      toast.error("Error getting configurations");
      return;
    }
    if (res.data) {
      setConfigurations(res.data);
    }
  }
  useEffect(() => {
    getConfigurations();
  }, [])

  const getIcon = (view: string) => {
    switch (view) {
      case "order":
        return "📋";
      case "kitchen":
        return "👨‍🍳";
      case "delivery":
        return "🚚";
      case "delivery-management":
        return "📦";
      case "manage-orders":
        return "📋";
      case "reports":
        return "📊";
      case "menu-structure":
        return "🍽️";
      case "users":
        return "👥";
      case "configurations":
        return "⚙️";
      default:
        return "📄";
    }
  };
  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ${isOpen ? "w-64" : "w-16"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {isOpen && (
            <div className="flex items-center gap-2">
              <img crossOrigin="anonymous" src={configurations.logo ? configurations.logo : "./assets/logo.png"} alt="Logo" className="size-6" />
              <h1 className="text-lg font-bold text-gray-800">
                {configurations.name ? configurations.name : "Delivery System"}
              </h1>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <DoubleBackArrowIcon className={`w-5 h-5 transition-transform duration-300 rotate-180 ${isOpen ? "rotate-360" : ""}`} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-4">
          {navItems.map(({ view, label, roles }: NavItem) =>
            roles && roles.includes(userRole!.toLowerCase()) ? (
              <button
                key={view}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${currentView === view
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
                onClick={() => {
                  setView(view);
                  setIsOpen(false); // Close sidebar after selection
                }}
                title={!isOpen ? label : undefined}
              >
                <span className="text-xl flex-shrink-0">{getIcon(view)}</span>
                {isOpen && (
                  <span className="font-medium truncate">{label}</span>
                )}
              </button>
            ) : null
          )}
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 ${!isOpen ? "justify-center" : ""
              }`}
            onClick={onLogout}
            title={!isOpen ? "Logout" : undefined}
          >
            <span className="text-xl flex-shrink-0">🚪</span>
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};
