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
export interface Order {
  id: string;
  orderId: string;
  status: string;
  updatedAt?: string;
  createdAt?: string;
  items?: OrderItem[];
}
export interface FilterType {
  searchTerm: string;
  selectedDate: Date | null;
  selectedStatus: string[];
}