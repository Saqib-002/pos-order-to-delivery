import { useState } from "react";
import { OrderForm } from "@/renderer/components/OrderForm";
import { OrderList } from "@/renderer/components/OrderList";
import { KitchenView } from "@/renderer/Views/KitchenView";
import { DeliveryView } from "@/renderer/Views/DeliveryView";
import { ReportView } from "@/renderer/Views/ReportView";

const App: React.FC = () => {
    const [view, setView] = useState("order");
    const renderView = () => {
    switch (view) {
      case "order":
        return <OrderForm/>
      case "kitchen":
        return <KitchenView />;
      case "delivery":
        return <DeliveryView/>;
      case "reports":
        return <ReportView/>;
      default:
        return <div>Page Not Found</div>;
    }
  };
    return (
        <div className="min-h-screen bg-slate-100 p-4">
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
                        className={`mr-2 p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "order" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("order")}
                    >
                        Orders
                    </button>
                    <button
                        className={`mr-2 p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "kitchen" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("kitchen")}
                    >
                        Kitchen View
                    </button>
                    <button
                        className={`mr-2 p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "delivery" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("delivery")}
                    >
                        Delivery View
                    </button>
                    <button
                        className={`mr-2 p-2 rounded-lg font-semibold py-2 px-6 shadow-md  transition-colors cursor-pointer duration-150 ${view === "reports" ? "bg-indigo-600 text-slate-100 hover:bg-indigo-700" : "hover:bg-indigo-600 hover:text-slate-100 bg-slate-200 text-slate-700"}`}
                        onClick={() => setView("reports")}
                    >
                        Reports
                    </button>
                    <button
                        className="mr-2 p-2 bg-red-500 text-white rounded-lg font-semibold py-2 px-6 shadow-md hover:bg-red-600 transition-colors cursor-pointer duration-150"
                        onClick={() => {}}
                    >
                        LogOut
                    </button>
                </div>
            </nav>
            {renderView()}
            <OrderList />
        </div>
    );
};

export default App;
