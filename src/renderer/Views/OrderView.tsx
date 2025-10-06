import { FilterType, Order } from "@/types/order";
import OrderComponent from "../components/order/OrderComponent";
import OrderMenu from "../components/order/OrderMenu";
import OrderComponentHeader from "../components/order/OrderComponentHeader";
import { OrderProvider } from "../contexts/OrderContext";
import { useEffect } from "react";
interface OrderViewProps {
  orders: Order[];
  refreshOrdersCallback: () => void;
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
}

export const OrderView: React.FC<OrderViewProps> = ({
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
      <div className="grid grid-cols-12 h-[calc(100vh-6rem-1px)]">
        <div className="col-span-3 border-r border-gray-300 flex flex-col">
          <OrderComponentHeader
            refreshOrdersCallback={refreshOrdersCallback}
            filter={filter}
            setFilter={setFilter}
          />
          <div className="h-[1px] bg-gray-400"></div>
          <OrderComponent
            orders={orders}
            refreshOrdersCallback={refreshOrdersCallback}
          />
        </div>
        <div className="col-span-9 flex flex-col overflow-y-auto">
          <OrderMenu />
        </div>
      </div>
    </OrderProvider>
  );
};
