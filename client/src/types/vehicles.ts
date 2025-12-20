export interface Vehicle {
  id: string;
  model: string;
  licensePlate: string;
  color: string;
  hasGps: boolean;
  type: 'bike' | 'car';
  driverId?: string;
  driverName?: string;
  itvDate: string;
  insuranceDate: string;
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
}