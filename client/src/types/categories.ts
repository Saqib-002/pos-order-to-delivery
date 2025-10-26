export interface Category{
    id: string;
    categoryName: string;
    color: string;
    itemCount?: number;
    createdAt: string;
    imgUrl?: string;
    updatedAt: string;
    isDeleted: boolean;
}
export interface SubCategory{
    id: string;
    itemCount?: number;
    menuCount?: number;
    name: string;
    color: string;
    imgUrl?: string;
    isForMenu?: boolean;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
}