import OrderComponent from "../components/order/OrderComponent";
import OrderMenu from "../components/order/OrderMenu";
import OrderComponentHeader from "../components/order/OrderComponentHeader";
import { OrderProvider } from "../contexts/OrderContext";

export const OrderView = () => {
  return (
    <OrderProvider>
      <div className="flex size-full">
        <div className="border-r border-gray-300 grid grid-rows-12 h-screen min-w-[360px]">
          <OrderComponentHeader />
          <OrderComponent />
        </div>
        <div className="flex flex-col overflow-y-auto w-full">
          <OrderMenu />
        </div>
      </div>
    </OrderProvider>
  );
};
