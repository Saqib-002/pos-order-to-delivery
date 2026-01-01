export interface MarketPurchaseItem {
  id?: string;
  purchaseId?: string;
  productName: string;
  box: number;
  unit: number;
  totalUnit: number;
  unitPrice: number;
  tax: number;
  total: number;
  expenseTypeId?: string;
  expenseTypeName?: string;
  isTaxIncluded?: boolean;
}

export interface MarketPurchase {
  id?: string;
  supplierId: string;
  supplierName?: string;
  ticketDate: string;
  ticketNumber: string;
  paymentType: string;
  totalAmount: number;
  items?: MarketPurchaseItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketPurchaseFilters {
  page: number;
  pageSize: number;
  search?: string;
  supplierId?: string;
  expenseTypeId?: string;
  startDate?: string;
  endDate?: string;
  ticketNumber?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
