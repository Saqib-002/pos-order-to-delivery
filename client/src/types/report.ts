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
      otherIncome?: number;
      cashOutExpenses?: number;
    };
  };
  graphData: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
  breakdowns?: {
    otherIncomeBySource: Array<{ name: string; total: number; pending: number }>;
    marketPurchasesByType: Array<{ name: string; total: number; pending: number }>;
    marketPurchasesBySupplier: Array<{ name: string; total: number; pending: number }>;
    salariesByWorker: Array<{ name: string; total: number; pending: number }>;
    maintenanceByVehicle: Array<{ name: string; total: number; pending: number }>;
    purchasesByProduct: Array<{ name: string; total: number; units: number }>;
    paymentMethods: {
      income: Record<string, number>;
      expenses: Record<string, number>;
    };
    cashOuts?: Array<{ name: string; total: number; date: string; paymentType: string }>;
  };
}

export interface WorkerSalariesReport {
  workers: Array<{
    workerId: string;
    workerName: string;
    salaries: Array<{
      id: string;
      date: string;
      base: number;
      socialSecurityCompany: number;
      socialSecurityWorker: number;
      irpf: number;
      extraPayment: number;
      bonus: number;
      extraServices: number;
      total: number;
      payments: Array<{
        method: string;
        amount: number;
        date: string;
        notes?: string;
      }>;
    }>;
    totalPaid: number;
    totalSalary: number;
    paymentMethods: Record<string, number>;
  }>;
  paymentMethodTotals: Record<string, number>;
  summary: {
    totalSalaries: number;
    totalPaid: number;
    outstanding: number;
  };
}

export interface MarketPurchasesReport {
  suppliers: Array<{
    supplierId: string;
    supplierName: string;
    supplierContact?: string;
    purchases: Array<{
      id: string;
      ticketDate: string;
      ticketNumber: string;
      paymentType: string;
      totalAmount: number;
      items: Array<{
        productName: string;
        box: number;
        unit: number;
        totalUnit: number;
        unitPrice: number;
        tax: number;
        total: number;
        expenseTypeName?: string;
      }>;
    }>;
    totalSpent: number;
    paymentMethods: Record<string, number>;
  }>;
  purchases: Array<any>;
  paymentMethodTotals: Record<string, number>;
  summary: {
    totalPurchases: number;
    totalSuppliers: number;
    avgPurchasePerSupplier: number;
  };
}

export interface VehiclesMaintenanceReport {
  vehicles: Array<{
    vehicleId: string;
    vehicleName: string;
    plateNumber: string;
    brand: string;
    model: string;
    maintenance: Array<{
      id: string;
      sparePart: string;
      unit: number;
      price: number;
      total: number;
      date: string;
      currentMileage?: number;
      paymentType?: string;
    }>;
    totalSpent: number;
    paymentMethods: Record<string, number>;
  }>;
  maintenance: Array<any>;
  paymentMethodTotals: Record<string, number>;
  summary: {
    totalMaintenance: number;
    totalVehicles: number;
    avgMaintenancePerVehicle: number;
  };
}

export interface PaymentMethodsReport {
  paymentMethods: {
    income: Record<string, number>;
    expenses: Record<string, number>;
    cashOuts: Record<string, number>;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalCashOut: number;
    netCashFlow: number;
    cashBalance: number;
  };
}
