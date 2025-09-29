import { navItems } from "@/constants";
import { NavItem } from "@/types/view";

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
}) => (
    <nav className="flex justify-between items-center pb-4 border-b border-slate-300">
        <div className="flex items-center gap-2">
            <img src="./assets/logo.png" alt="Logo" className="size-6" />
            <h1 className="text-2xl font-bold">Delivery System</h1>
        </div>
        <div className="flex items-center gap-2">
            {navItems.map(({ view, label, roles }: NavItem) =>
                roles && roles.includes(userRole!.toLowerCase()) ? (
                    <button
                        key={view}
                        className={`mr-2 outline-none p-2 rounded-lg font-semibold py-2 px-6 shadow-md transition-colors cursor-pointer duration-150 ${
                            currentView === view
                                ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700"
                                : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"
                        }`}
                        onClick={() => setView(view)}
                    >
                        {label}
                    </button>
                ) : null
            )}
            <button
                className="mr-2 outline-none p-2 bg-red-500 text-white rounded-lg font-semibold py-2 px-6 shadow-md hover:bg-red-600 transition-colors cursor-pointer duration-150"
                onClick={onLogout}
            >
                LogOut
            </button>
        </div>
    </nav>
);
