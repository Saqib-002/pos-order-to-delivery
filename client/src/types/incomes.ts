export interface Income {
  id?: string;
  name: string;
  description?: string;
  total: number;
  paymentType: string;
  date: string;
  ticketId?: string;
  incomeSourceId?: string;
  transactionType?: 'in' | 'out';
  createdAt?: string;
  updatedAt?: string;
}

export interface IncomeFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface IncomeSummary {
  totalAmount: number;
  totalPendingAmount?: number;
  paymentMethodTotals: Record<string, { paid: number; pending: number }>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  summary?: IncomeSummary;
}
