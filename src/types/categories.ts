export interface Category{
    id: string;
    categoryName: string;
    color: string;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
}
export interface SubCategory{
    id: string;
    name: string;
    color: string;
    isForMenu?: boolean;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
}