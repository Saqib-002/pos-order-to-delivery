export interface Item {
  id:string;
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
  };
  orderId?: number;
  items: Item[];
  status: string;
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string;
  deliveredAt?: string;
  syncAt?: string;
  isDeleted?: boolean;
  deliveryPerson?: string;
  notes?: string;
}
