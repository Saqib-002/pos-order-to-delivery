export interface Variant{
    id: string;
    groupName?: string;
    color: string;
    createdAt: string;
    updatedAt: string;
    items?: VariantItem[];
}
export interface VariantItem{
    id: string;
    name: string;
    priority: number;
    variantId: string;
    createdAt: string;
    updatedAt: string;
}