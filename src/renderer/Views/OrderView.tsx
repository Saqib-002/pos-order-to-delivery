import { FilterType, Order } from "@/types/order";
import OrderComponent from "../components/order/OrderComponent";
import OrderMenu from "../components/order/OrderMenu";
import OrderComponentHeader from "../components/order/OrderComponentHeader";
import { OrderProvider } from "../contexts/OrderContext";
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
  return (
    <OrderProvider>
      <div className="grid grid-cols-12 h-[calc(100vh-6rem)]">
        <div className="col-span-3 border-r border-gray-300 h-full flex flex-col">
          <OrderComponentHeader token={token} />
          <div className="h-[1px] bg-gray-400"></div>
          <OrderComponent token={token} />
        </div>
        <div className="col-span-9 h-full flex flex-col">
          <OrderMenu token={token} />
        </div>
      </div>
    </OrderProvider>
  );
};
