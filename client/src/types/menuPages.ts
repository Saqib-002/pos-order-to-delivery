export interface MenuPage {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  isDeleted: boolean;
}

export interface MenuPageProduct {
  id: string;
  menuPageId: string;
  productId: string;
  productName: string;
  supplement: number;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuPageAssociation {
  id: string;
  menuId?: string;
  menuPageId?: string;
  pageName: string;
  minimum: number;
  maximum: number;
  priority: number;
  kitchenPriority: string;
  multiple: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Menu {
  id: string;
  name: string;
  subcategoryId: string;
  description?: string;
  price: number;
  imgUrl?: string;
  priority: number;
  tax: number;
  discount: number;
  outstanding: boolean;
  createdAt: string;
  updatedAt: string;
}
