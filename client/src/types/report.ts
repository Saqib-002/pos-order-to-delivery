import { Order } from "./order";

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
    topMenus: { name: string; count: number }[];
    orders: Order[];
}
