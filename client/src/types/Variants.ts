export interface Variant {
  id: string;
  name?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  items?: VariantItem[];
}
export interface VariantItem {
  id: string;
  name: string;
  priority: number;
  variantId: string;
  price?: number;
  imgUrl?: string;
  createdAt: string;
  updatedAt: string;
}
