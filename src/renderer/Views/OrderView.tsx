import { FilterType, Order } from "@/types/order";
import OrderComponent from "../components/order/OrderComponent";
import OrderMenu from "../components/order/OrderMenu";
import OrderComponentHeader from "../components/order/OrderComponentHeader";
import { OrderProvider } from "../contexts/OrderContext";
import { useEffect } from "react";
interface OrderViewProps {
  orders: Order[];
  token: string | null;
  refreshOrdersCallback: () => void;
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
}

export const OrderView: React.FC<OrderViewProps> = ({
  token,
  orders,
  refreshOrdersCallback,
  filter,
  setFilter,
}) => {
  const now = new Date();
  const localMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    5,
    0,
    0
  );
  useEffect(() => {
    setFilter({
      searchTerm: "",
      selectedDate: localMidnight,
      selectedStatus: [],
    });
  }, []);
  return (
    <OrderProvider>
      <div className="grid grid-cols-12 h-[calc(100vh-6rem)]">
        <div className="col-span-3 border-r border-gray-300 h-full flex flex-col">
          <OrderComponentHeader token={token} />
          <div className="h-[1px] bg-gray-400"></div>
          <OrderComponent
            token={token}
            orders={orders}
            refreshOrdersCallback={refreshOrdersCallback}
          />
        </div>
        <div className="col-span-9 h-full flex flex-col">
          <OrderMenu token={token} />
        </div>
      </div>
    </OrderProvider>
  );
};
