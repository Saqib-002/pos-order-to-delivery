export interface Vehicle {
  id: string;
  model: string;
  licensePlate: string;
  color: string;
  hasGps: boolean;
  type: "bike" | "car";
  driverId?: string;
  driverName?: string;
  itvDate: string;
  insuranceDate: string;
  insuranceNumber?: string;
  insuranceCompany?: string;
  insurancePrice?: number;
  insurancePaymentTerm?: "monthly" | "yearly";
  registrationDate?: string;
  createdAt: string;
  updatedAt: string;
  alerts?: string[];
}

export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  sparePart: string;
  unit: number;
  price: number;
  total: number;
  date: string;
  currentMileage?: number;
  paymentType?: string;
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

export interface VehicleFilters {
  search?: string;
  type?: "bike" | "car" | "all";
  hasGps?: boolean | null;
  driverId?: string;
  alertStatus?: "all" | "has_alerts" | "expired" | "expiring_soon";
  page: number;
  pageSize: number;
}

export interface MaintenanceFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  paymentStatus?: "all" | "PAID" | "UNPAID" | "PARTIAL";
  page: number;
  pageSize: number;
}
