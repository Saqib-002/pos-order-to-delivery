import { Order, FilterType } from "./order";

export interface AnalyticsType {
    totalOrders: number;
    inProgress: number;
    successRate: number;
    totalDelivered: number;
    totalSentToKitchen: number;
    totalReadyForDelivery: number;
    totalOutForDelivery: number;
    totalCancelled: number;
    avgDeliveryTime: number;
    hourlyData: number[];
    topItems: { name: string; count: number }[];
    orders: Order[];
}

export interface ReportViewProps {
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    filter: FilterType;
    setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
}