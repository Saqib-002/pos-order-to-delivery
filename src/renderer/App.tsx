import { useState } from "react";
import { OrderView } from "@/renderer/Views/OrderView";
import { KitchenView } from "@/renderer/Views/KitchenView";
import { DeliveryView } from "@/renderer/Views/DeliveryView";
import { ReportView } from "@/renderer/Views/ReportView";
import { OrderForm } from "./components/order/OrderForm";

const App: React.FC = () => {
    const [view, setView] = useState("order");
    const [isAddOrderModelShown, setIsAddOrderModelShown] = useState(false);
    const renderView = () => {
        switch (view) {
            case "order":
                return (
                    <OrderView
                        setIsAddOrderModelShown={setIsAddOrderModelShown}
                    />
                );
            case "kitchen":
                return <KitchenView />;
            case "delivery":
                return <DeliveryView />;
            case "reports":
                return <ReportView />;
            default:
                return <div>Page Not Found</div>;
        }
    };
    return (
        <div className="min-h-screen bg-slate-100 p-4">
            {isAddOrderModelShown && (
                <div className="absolute top-0 left-0 w-full h-full z-10 flex justify-center items-center bg-slate-400/40 backdrop-blur-sm ">
                    <div
                        className="w-full h-full absolute top-0 left-0 z-20 bg-transparent"
                        onClick={() => setIsAddOrderModelShown(false)}
                    ></div>
                    <div className="bg-slate-100 border border-slate-200 shadow w-11/12 p-8 rounded-md relative z-30">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className=" text-2xl font-bold">New Order</h2>
                            <span
                                className="cursor-pointer text-3xl text-red-500 hover:text-red-700 transition-colors duration-150"
                                onClick={() => setIsAddOrderModelShown(false)}
                            >
                                X
                            </span>
                        </div>
                        <OrderForm />
                    </div>
                </div>
            )}
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
                    <button
                        className={`mr-2 outline-none p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "order" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("order")}
                    >
                        Orders
                    </button>
                    <button
                        className={`mr-2 outline-none p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "kitchen" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("kitchen")}
                    >
                        Kitchen View
                    </button>
                    <button
                        className={`mr-2 outline-none p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "delivery" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("delivery")}
                    >
                        Delivery View
                    </button>
                    <button
                        className={`mr-2 outline-none p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "reports" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("reports")}
                    >
                        Reports
                    </button>
                    <button
                        className="mr-2 outline-none p-2 bg-red-500 text-white rounded-lg font-semibold py-2 px-6 shadow-md hover:bg-red-600 transition-colors cursor-pointer duration-150"
                        onClick={() => {}}
                    >
                        LogOut
                    </button>
                </div>
            </nav>
            {renderView()}
        </div>
    );
};

export default App;
