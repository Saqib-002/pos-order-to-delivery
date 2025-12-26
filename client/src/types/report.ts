import { Order } from "./order";

export interface AnalyticsType {
  totalOrders: number;
  inProgress: number;
  successRate: number;
  totalCompleted: number;
  totalDelivered: number;
  totalSentToKitchen: number;
  totalReadyForDelivery: number;
  totalOutForDelivery: number;
  totalCancelled: number;
  avgDeliveryTime: number;
  hourlyData: number[];
  topItems: { name: string; count: number }[];
  topMenus: { name: string; count: number }[];
  orderTypeTotals: { type: string; total: number }[];
  orders: Order[];
  ordersTotalCount: number;
}
export interface FinancialAnalyticsType {
  summary: {
    income: number;
    totalExpenses: number;
    netProfit: number;
    breakdown: {
      vehicleExpenses: number;
      workerExpenses: number;
      marketExpenses: number;
    };
  };
  graphData: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
}
