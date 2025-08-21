export interface Item{
  name: string;
  quantity: number;
}
export interface Order {
  _id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  orderId?:number;
  type?: "customer" | "delivery_person";
  items: Item[];
  status: string;
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string;
  deliveredAt?: string;
  deliveryPerson?: string;
}