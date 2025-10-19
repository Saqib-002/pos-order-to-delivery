import { VIEWS } from "@/constants";
import { JSX, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AccessDenied } from "./components/shared/AccessDenied";
import { Navigation } from "./components/shared/Navigation";
import { PageNotFound } from "./components/shared/PageNotFound";
import { DeliveryManagement } from "./Views/DeliveryManagement";
import { DeliveryView } from "./Views/DeliveryView";
import { KitchenView } from "./Views/KitchenView";
import { LoginView } from "./Views/LoginView";
import { ManageOrdersView } from "./Views/ManageOrdersView";
import { MenuView } from "./Views/MenuView";
import { OrderView } from "./Views/OrderView";
import { ReportView } from "./Views/ReportView";
import { UserManagement } from "./Views/UserManagement";
import { useAuth } from "./contexts/AuthContext";
import Configurations from "./Views/Configurations";
import { OrderManagementProvider } from "./contexts/orderManagementContext";
import i18n from "@/i18n";
import { useConfigurations } from "./contexts/configurationContext";

interface ViewConfig {
  component: JSX.Element;
  roles?: string[];
}

const App: React.FC = () => {
  const [view, setView] = useState<string>(VIEWS.LOGIN);
  const { auth, logout } = useAuth();
  const { setLanguage } = useConfigurations();

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      i18n.changeLanguage(savedLanguage);
      setLanguage(savedLanguage as 'en' | 'es');
    }
  }, [])
  const handleLogin = () => {
    setView(VIEWS.ORDER);
  };
  const handleLogout = async () => {
    try {
      await logout();
      setView(VIEWS.LOGIN);
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const viewConfig: Record<string, ViewConfig> = {
    [VIEWS.ORDER]: {
      component: (
        <OrderView />
      ),
    },
    [VIEWS.KITCHEN]: {
      component: (
        <KitchenView />
      ),
      roles: ["admin", "kitchen"],
    },
    [VIEWS.DELIVERY]: {
      component: (
        <DeliveryView />
      ),
      roles: ["admin", "delivery"],
    },
    [VIEWS.REPORTS]: {
      component: (
        <ReportView />
      ),
      roles: ["admin"],
    },
    [VIEWS.MENU_STRUCTURE]: {
      component: <MenuView />,
      roles: ["admin"],
    },
    [VIEWS.USERS]: {
      component: <UserManagement />,
      roles: ["admin"],
    },
    [VIEWS.DELIVERY_MANAGEMENT]: {
      component: <DeliveryManagement />,
      roles: ["admin"],
    },
    [VIEWS.MANAGE_ORDERS]: {
      component: (
        <ManageOrdersView />
      ),
      roles: ["admin"],
    },
    [VIEWS.CONFIGURATIONS]: {
      component: (
        <Configurations />
      )
    }
  };

  const renderView = () => {
    const currentView = viewConfig[view];
    if (!currentView) return <PageNotFound />;
    if (
      currentView.roles &&
      !currentView.roles.includes(auth.user?.role || "")
    ) {
      return (
        <AccessDenied
          message={`You need ${currentView.roles.join(" or ")} access to view this page.`}
        />
      );
    }
    return currentView.component;
  };

  if (!auth.token) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navigation
        currentView={view}
        setView={setView}
        userRole={auth.user?.role}
        onLogout={handleLogout}
      />
      <div className="ml-16 h-screen overflow-y-auto">
        <OrderManagementProvider auth={auth}>
          {renderView()}
        </OrderManagementProvider>
      </div>
    </div>
  );
};

export default App;
