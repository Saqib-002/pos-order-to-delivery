import { useEffect, useState } from "react";
import { OrderView } from "@/renderer/Views/OrderView";
import { KitchenView } from "@/renderer/Views/KitchenView";
import { DeliveryView } from "@/renderer/Views/DeliveryView";
import { ReportView } from "@/renderer/Views/ReportView";
import { Order } from "@/types/order";
import { toast } from "react-toastify";
import { debounce } from "lodash";

const showSuccessToast = debounce((message: string) => {
  toast.success(message);
}, 1000);
const showErrorToast = debounce((message: string) => {
  toast.error(message);
}, 1000);

const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState("order");

  useEffect(() => {
      const fetchOrders = async () => {
        const results = await (window as any).electronAPI.getOrders();
        setOrders(results);
      };
      fetchOrders();
      const handleChange = (change: any) => {
        if (change.doc) {
          setOrders((prevOrders) => {
            const updatedOrders = [...prevOrders];
            const index = updatedOrders.findIndex(
              (order) => order._id === change.id
            );
            const isCreated=Number(change.doc._rev.split("-")[0])===1
            if (index !== -1 && !isCreated) {
              // Update existing order
              updatedOrders[index] = change.doc;
              showSuccessToast(`Order#${change.doc.orderId} updated, status:${change.doc.status}`);
            } else if (!change.deleted) {
              // Add new order
              updatedOrders.push(change.doc);
              showSuccessToast(`Order#${change.doc.orderId} sent to kitchen`);
            } else {
              // Remove deleted order
              showErrorToast(`Order#${change.doc.orderId} deleted`);
              const newUpdatedOrders=updatedOrders.filter((order) => order._id !== change.id);
              return newUpdatedOrders
            }
            return updatedOrders;
          });
        } else if (change.deleted) {
          // Handle deletion when doc is not included
          setOrders((prevOrders) =>
            prevOrders.filter((order) => order._id !== change.id)
          );
        } else {
          // Fallback: refresh all orders
          (window as any).electronAPI
            .getOrders()
            .then((result: any) => {
              setOrders(result.rows.map((row: any) => row.doc));
            })
            .catch(() => {
              toast.error("Error fetching orders");
            });
        }
      };
  
      // Register change listener and get cleanup function
      const cleanup = (window as any).electronAPI.onDbChange(handleChange);
  
      // Cleanup listener on unmount
      return () => {
        cleanup();
      };
    }, []);

  const renderView = () => {
    switch (view) {
      case "order":
        return <OrderView orders={orders} setOrders={setOrders}/>;
      case "kitchen":
        return <KitchenView orders={orders} setOrders={setOrders}/>;
      case "delivery":
        return <DeliveryView orders={orders} setOrders={setOrders}/>;
      case "reports":
        return <ReportView orders={orders} setOrders={setOrders}/>;
      default:
        return <div>Page Not Found</div>;
    }
  };
  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <nav className="flex justify-between items-center mb-6 pb-4 border-b border-slate-300">
        <div className="flex items-center gap-2">
          <img src="./assets/logo.png" alt="Logo" className="size-6" />
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
