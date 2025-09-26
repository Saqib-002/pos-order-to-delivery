import { FilterType, Order } from "@/types/order";
import OrderComponent from "../components/order/OrderComponent";
import OrderMenu from "../components/order/OrderMenu";
import OrderComponentHeader from "../components/order/OrderComponentHeader";
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
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-7.5rem)]">
            <div className="col-span-3 bg-gray-100 border border-gray-300 rounded-md shadow-md h-full">
                <OrderComponentHeader />
                <OrderComponent />
            </div>
            <div className="bg-gray-100 col-span-9 h-full shadow-md border border-gray-300 rounded-md">
                <OrderMenu />
            </div>
        </div>
    );
};
