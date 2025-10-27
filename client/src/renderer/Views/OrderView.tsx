import OrderComponent from "../components/order/OrderComponent";
import OrderMenu from "../components/order/OrderMenu";
import OrderComponentHeader from "../components/order/OrderComponentHeader";
import { OrderProvider } from "../contexts/OrderContext";

export const OrderView = () => {
  return (
    <OrderProvider>
      <div className="grid grid-cols-12 h-full">
        <div className="col-span-3 border-r border-gray-300 grid grid-rows-12 h-screen">
          <OrderComponentHeader />
          <OrderComponent />
        </div>
        <div className="col-span-9 flex flex-col overflow-y-auto">
          <OrderMenu />
        </div>
      </div>
    </OrderProvider>
  );
};
