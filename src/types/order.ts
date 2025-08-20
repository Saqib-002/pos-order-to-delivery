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
  items: Item[];
  status: string;
  createdAt: string;
  deliveryPerson?: string;
}