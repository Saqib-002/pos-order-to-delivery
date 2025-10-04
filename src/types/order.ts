export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productTax: number;
  variantId: string;
  variantName: string;
  variantPrice: number;
  complements: Array<{
    groupId: string;
    groupName: string;
    itemId: string;
    itemName: string;
    price: number;
  }>;
  quantity: number;
  totalPrice: number;
  menuContext?: {
    menuId: string;
    menuName: string;
    menuPageId: string;
    menuPageName: string;
    supplement: number;
  };
}
export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address: string;
  cif?: string;
  email?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface DeliveryPerson{
  id?: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  licenseNo: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface Order {
  id: string;
  orderId: string;
  customer: Customer;
  notes: string;
  orderType: "pickup" | "delivery" | "dine-in";
  paymentType: "cash" | "card" ;
  isPaid: boolean;
  status: string;
  deliveryPerson?: DeliveryPerson;
  assignedAt?: string;
  readyAt?: string;
  cancelAt?: string;
  deliveredAt?: string;
  updatedAt?: string; 
  createdAt?: string;
  items?: OrderItem[];
}
export interface FilterType {
  searchTerm: string;
  selectedDate: Date | null;
  selectedStatus: string[];
}