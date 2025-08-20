export interface Order {
  _id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: string;
  status: string;
  createdAt: string;
  deliveryPerson?: string;
}