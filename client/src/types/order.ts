export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  productPrice: number;
  productDescription: string;
  productPriority: number;
  productDiscount: number;
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
    priority: number;
  }>;
  printers?: string[];
  quantity: number;
  totalPrice: number;
  menuDescription?: string;
  menuDiscount?: number;
  menuTax?: number;
  menuPrice?: number;
  menuId?: string;
  menuSecondaryId?: number;
  menuName?: string;
  menuPageId?: string;
  menuPageName?: string;
  supplement?: number;
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
export interface DeliveryPerson {
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
  paymentType: "cash" | "card";
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
  selectedPaymentStatus: string[];
  selectedDeliveryPerson: string;
  page: number;
  limit: number;
  startDateRange: Date | null;
  endDateRange: Date | null;
}
export interface PrinterType {
  id?: string;
  name: string;
  displayName: string;
  createdAt?: string;
  updatedAt?: string;
}
