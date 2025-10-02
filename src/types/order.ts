export interface Item {
  id: string;
  name: string;
  quantity: number;
  ingredients?: string[];
  customIngredients?: string[];
  specialInstructions?: string;
  price?: number;
  category?: string;
}
export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    email: string;
    cif?: string;
    comments?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  orderId?: number;
  items: Item[];
  status: string;
  orderType?: string;
  paymentType?: string;
  createdAt: string;
  updatedAt?: string;
  readyAt?: string;
  cancelledAt?: string;
  deliveredAt?: string;
  syncAt?: string;
  isDeleted?: boolean;
  deliveryPersonId?: string;
  deliveryPerson?: {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
    licenseNo?: string;
  };
  notes?: string;
}
export interface FilterType {
  searchTerm: string;
  selectedDate: Date | null;
  selectedStatus: string[];
}