export interface Worker {
  id: string;
  name: string;
  dateOfBirth?: string;
  idNumber?: string;
  phoneNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerSalary {
  id: string;
  workerId: string;
  base: number;
  socialSecurityCompany: number;
  socialSecurityWorker: number;
  irpf: number;
  extraPayment: number;
  bonus: number;
  extraServices: number;
  total: number;
  totalPaid?: number;
  date: string;
  createdAt?: string;
}

export interface WorkerSalaryPayment {
  id: string;
  salaryId: string;
  paymentMethod: "cash" | "card" | "bizum" | "bank-transfer";
  amount: number;
  notes?: string;
  paymentDate: string;
  createdAt?: string;
}

export interface WorkerFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface SalaryFilters {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
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
