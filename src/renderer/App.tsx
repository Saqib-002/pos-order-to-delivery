import { useEffect, useRef, useState } from "react";
import { OrderView } from "@/renderer/Views/OrderView";
import { KitchenView } from "@/renderer/Views/KitchenView";
import { DeliveryView } from "@/renderer/Views/DeliveryView";
import { ReportView } from "@/renderer/Views/ReportView";
import { Order } from "@/types/order";
import { toast } from "react-toastify";
import { AuthState, User } from "@/types/user";
import { LoginView } from "./Views/LoginView";
import { UserManagement } from "./Views/UserManagement";
import {
    navItems,
    NOTIFICATION_VOLUME,
    VIEWS,
} from "@/constants";
import { handleOrderChange, refreshOrders } from "./utils/order";

const App: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [view, setView] = useState("login");
    const [auth, setAuth] = useState<AuthState>({ token: null, user: null });
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!auth.token) return;
        refreshOrders(setOrders, auth.token);
        const handleChange = (change: any) =>
            handleOrderChange({ setOrders, change, auth });
        // Register change listener and get cleanup function
        const cleanup = (window as any).electronAPI.onDbChange(handleChange);
        audioRef.current = new Audio("./assets/notification.wav");
        audioRef.current.volume = NOTIFICATION_VOLUME;

        // Listen for toast changes
        const unsubscribe = toast.onChange((payload) => {
            if (payload.status === "added") {
                // Play sound when a toast is added
                if (audioRef.current) {
                    audioRef.current.play().catch((error) => {
                        console.error("Error playing sound:", error);
                    });
                }
            }
        });

        // Cleanup listener on unmount
        return () => {
            cleanup();
            unsubscribe();
        };
    }, [auth.token]);
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
    const renderView = () => {
        switch (view) {
            case "order":
                return <OrderView orders={orders} token={auth.token} />;
            case "kitchen":
                if (
                    auth.user?.role === "admin" ||
                    auth.user?.role === "kitchen"
                ) {
                    return (
                        <KitchenView
                            orders={orders}
                            setOrders={setOrders}
                            token={auth.token}
                        />
                    );
                }
                return (
                    <div>Unauthorized: Admin or Kitchen access required</div>
                );
            case "delivery":
                if (
                    auth.user?.role === "admin" ||
                    auth.user?.role === "delivery"
                ) {
                    return (
                        <DeliveryView
                            orders={orders}
                            setOrders={setOrders}
                            token={auth.token}
                        />
                    );
                }
                return <div>Unauthorized</div>;
            case "reports":
                if (auth.user?.role === "admin") {
                    return <ReportView orders={orders} setOrders={setOrders} />;
                }
                return <div>Unauthorized</div>;
            case "users":
                if (auth.user?.role === "admin") {
                    return <UserManagement token={auth.token} />;
                }
                return <div>Unauthorized</div>;
            default:
                return <div>Page Not Found</div>;
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
                        <img
                            src="./assets/logo.png"
                            alt="Logo"
                            className="size-6"
                        />
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
