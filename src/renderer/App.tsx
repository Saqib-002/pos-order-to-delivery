import { VIEWS } from "@/constants";
import { FilterType } from "@/types/order";
import { AuthState } from "@/types/user";
import { JSX, useState } from "react";
import { toast } from "react-toastify";
import { AccessDenied } from "./components/shared/AccessDenied";
import { Navigation } from "./components/shared/Navigation";
import { PageNotFound } from "./components/shared/PageNotFound";
import { useOrderManagement } from "./hooks/useOrderManagement";
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

interface ViewConfig {
  component: JSX.Element;
  roles?: string[];
}

const App: React.FC = () => {
  const [view, setView] = useState<string>(VIEWS.LOGIN);
  const [filter, setFilter] = useState<FilterType>({
    searchTerm: "",
    selectedDate: null,
    selectedStatus: ["all"],
  });
  const { auth, logout } = useAuth();

  const { orders, setOrders, refreshOrdersCallback } = useOrderManagement(
    auth,
    filter
  );
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
        <OrderView
          orders={orders}
          refreshOrdersCallback={refreshOrdersCallback}
          filter={filter}
          setFilter={setFilter}
        />
      ),
    },
    [VIEWS.KITCHEN]: {
      component: (
        <KitchenView
          orders={orders}
          filter={filter}
          setFilter={setFilter}
          refreshOrdersCallback={refreshOrdersCallback}
        />
      ),
      roles: ["admin", "kitchen"],
    },
    [VIEWS.DELIVERY]: {
      component: (
        <DeliveryView
          orders={orders}
          refreshOrdersCallback={refreshOrdersCallback}
          filter={filter}
          setFilter={setFilter}
        />
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
        <ManageOrdersView
          orders={orders}
          refreshOrdersCallback={refreshOrdersCallback}
          filter={filter}
          setFilter={setFilter}
        />
      ),
      roles: ["admin"],
    },
    [VIEWS.CONFIGURATIONS]:{
      component:(
        <Configurations/>
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
      <div className="ml-16 p-4 h-screen overflow-y-auto">{renderView()}</div>
    </div>
  );
};

export default App;
