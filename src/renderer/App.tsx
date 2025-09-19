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
import { MenuManagement } from "./Views/MenuManagement";
import { MenuView } from "./Views/MenuView";
import { OrderView } from "./Views/OrderView";
import { ReportView } from "./Views/ReportView";
import { UserManagement } from "./Views/UserManagement";

interface ViewConfig {
  component: JSX.Element;
  roles?: string[];
}

const App: React.FC = () => {
  const [view, setView] = useState<string>(VIEWS.LOGIN);
  const [auth, setAuth] = useState<AuthState>({ token: null, user: null });
  const [filter, setFilter] = useState<FilterType>({
    searchTerm: "",
    selectedDate: null,
    selectedStatus: ["all"],
  });

  const { orders, setOrders, refreshOrdersCallback } = useOrderManagement(
    auth,
    filter
  );

  const handleLogin = (token: string, user: Omit<User, "password">) => {
    setAuth({ token, user });
    setView(VIEWS.ORDER);
  };

  const handleLogout = async () => {
    try {
      await (window as any).electronAPI.logoutUser(auth.token);
      setAuth({ token: null, user: null });
      setView(VIEWS.LOGIN);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const viewConfig: Record<string, ViewConfig> = {
    [VIEWS.ORDER]: {
      component: (
        <OrderView
          orders={orders}
          token={auth.token!}
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
          token={auth.token!}
          refreshOrdersCallback={refreshOrdersCallback}
        />
      ),
      roles: ["admin", "kitchen"],
    },
    [VIEWS.DELIVERY]: {
      component: (
        <DeliveryView
          orders={orders}
          token={auth.token!}
          refreshOrdersCallback={refreshOrdersCallback}
          filter={filter}
          setFilter={setFilter}
        />
      ),
      roles: ["admin", "delivery"],
    },
    [VIEWS.REPORTS]: {
      component: (
        <ReportView
          token={auth.token}
          orders={orders}
          setOrders={setOrders}
          filter={filter}
          setFilter={setFilter}
        />
      ),
      roles: ["admin"],
    },
    [VIEWS.MENU]: {
      component: <MenuManagement token={auth.token!} />,
      roles: ["admin"],
    },
    [VIEWS.MENU_STRUCTURE]: {
      component: <MenuView />,
      roles: ["admin"],
    },
    [VIEWS.USERS]: {
      component: <UserManagement token={auth.token!} />,
      roles: ["admin"],
    },
    [VIEWS.DELIVERY_MANAGEMENT]: {
      component: <DeliveryManagement token={auth.token!} />,
      roles: ["admin"],
    },
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
    <div className="min-h-screen bg-slate-100 p-4">
      <Navigation
        currentView={view}
        setView={setView}
        userRole={auth.user?.role}
        onLogout={handleLogout}
      />
      {renderView()}
    </div>
  );
};

export default App;
