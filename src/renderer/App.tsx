import { useEffect, useRef, useState } from "react";
import { OrderView } from "@/renderer/Views/OrderView";
import { KitchenView } from "@/renderer/Views/KitchenView";
import { DeliveryView } from "@/renderer/Views/DeliveryView";
import { ReportView } from "@/renderer/Views/ReportView";
import { MenuManagement } from "@/renderer/Views/MenuManagement";
import { Order } from "@/types/order";
import { toast } from "react-toastify";
import { AuthState, User } from "@/types/user";
import { LoginView } from "./Views/LoginView";
import { UserManagement } from "./Views/UserManagement";
import { DeliveryManagement } from "./Views/DeliveryManagement";
import { navItems, VIEWS } from "@/constants";
import { handleOrderChange, refreshOrders } from "./utils/order";

const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState("login");
  const [auth, setAuth] = useState<AuthState>({ token: null, user: null });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const orderChangeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!auth.token) return;
    refreshOrders(setOrders, auth.token);
    if (orderChangeCleanupRef.current) {
      orderChangeCleanupRef.current();
      orderChangeCleanupRef.current = null;
    }
    const cleanup = (window as any).electronAPI.onOrderChange((change: any) => {
      handleOrderChange({ auth, change, setOrders, audioRef });
    });
    orderChangeCleanupRef.current = cleanup;
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [auth.token]);
  const refreshOrderCallback = () => {
    if (auth.token) {
      refreshOrders(setOrders, auth.token);
    }
  };
  const handleLogin = (newToken: string, newUser: Omit<User, "password">) => {
    setAuth({ token: newToken, user: newUser });
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

  if (!auth.token) {
    return <LoginView onLogin={handleLogin} />;
  }
  console.log(orders);
  const renderView = () => {
    switch (view) {
      case "order":
        return <OrderView orders={orders} token={auth.token} refreshOrderCallback={refreshOrderCallback} />;
      case "kitchen":
        if (auth.user?.role === "admin" || auth.user?.role === "kitchen") {
          return (
            <KitchenView
              orders={orders}
              setOrders={setOrders}
              token={auth.token}
            />
          );
        }
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-7V6a3 3 0 00-6 0v3m0 0a2 2 0 002 2h6a2 2 0 002-2v-3m0 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You need Admin or Kitchen access to view this page.
              </p>
            </div>
          </div>
        );
      case "delivery":
        if (auth.user?.role === "admin" || auth.user?.role === "delivery") {
          return (
            <DeliveryView
              orders={orders}
              setOrders={setOrders}
              token={auth.token}
              refreshOrderCallback={refreshOrderCallback}
            />
          );
        }
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-7V6a3 3 0 00-6 0v3m0 0a2 2 0 002 2h6a2 2 0 002-2v-3m0 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You need Admin or Delivery access to view this page.
              </p>
            </div>
          </div>
        );
      case "reports":
        if (auth.user?.role === "admin") {
          return <ReportView orders={orders} setOrders={setOrders} />;
        }
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-7V6a3 3 0 00-6 0v3m0 0a2 2 0 002 2h6a2 2 0 002-2v-3m0 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You need Admin access to view reports.
              </p>
            </div>
          </div>
        );
      case "menu":
        if (auth.user?.role === "admin") {
          return <MenuManagement token={auth.token} />;
        }
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-7V6a3 3 0 00-6 0v3m0 0a2 2 0 002 2h6a2 2 0 002-2v-3m0 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You need Admin access to manage the menu.
              </p>
            </div>
          </div>
        );
      case "users":
        if (auth.user?.role === "admin") {
          return <UserManagement token={auth.token} />;
        }
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-7V6a3 3 0 00-6 0v3m0 0a2 2 0 002 2h6a2 2 0 002-2v-3m0 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You need Admin access to manage users.
              </p>
            </div>
          </div>
        );
      case "delivery-management":
        if (auth.user?.role === "admin") {
          return <DeliveryManagement token={auth.token} />;
        }
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-7V6a3 3 0 00-6 0v3m0 0a2 2 0 002 2h6a2 2 0 002-2v-3m0 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You need Admin access to manage delivery personnel.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Page Not Found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                The page you're looking for doesn't exist.
              </p>
            </div>
          </div>
        );
    }
  };

  const renderNavButton = (item: (typeof navItems)[0]) => {
    if (item.adminOnly && auth.user?.role !== "admin") return null;

    return (
      <button
        key={item.view}
        className={`mr-2 outline-none p-2 rounded-lg font-semibold py-2 px-6 shadow-md transition-colors cursor-pointer duration-150 ${
          view === item.view
            ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700"
            : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"
        }`}
        onClick={() => setView(item.view)}
      >
        {item.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      {auth.token && (
        <nav className="flex justify-between items-center mb-6 pb-4 border-b border-slate-300">
          <div className="flex items-center gap-2">
            <img src="./assets/logo.png" alt="Logo" className="size-6" />
            <h1 className="text-2xl font-bold">Delivery System</h1>
          </div>
          <div className="flex items-center gap-2">
            {navItems.map(renderNavButton)}
            <button
              className="mr-2 outline-none p-2 bg-red-500 text-white rounded-lg font-semibold py-2 px-6 shadow-md hover:bg-red-600 transition-colors cursor-pointer duration-150"
              onClick={handleLogout}
            >
              LogOut
            </button>
          </div>
        </nav>
      )}
      {renderView()}
    </div>
  );
};

export default App;
