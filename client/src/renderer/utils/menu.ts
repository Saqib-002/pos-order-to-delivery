import { toast } from "react-toastify";

export const getVariants = async (
    token: string | null,
    setVariants: React.Dispatch<React.SetStateAction<any>>
) => {
    const res = await (window as any).electronAPI.getVariants(token);
    if (!res.status) {
        toast.error("Unable to get variants");
        return;
    }
    setVariants(res.data);
};
export const getGroups = async (
    token: string | null,
    setGroups: React.Dispatch<React.SetStateAction<any>>
) => {
    (window as any).electronAPI.getGroups(token).then((res: any) => {
        if (!res.status) {
            toast.error("Unable to get groups");
            return;
        }
        setGroups(res.data);
    });
};
export const fetchCategories = async (
    token: string | null,
    setCategories: React.Dispatch<React.SetStateAction<any>>
) => {
    try {
        const res = await (window as any).electronAPI.getCategories(token);
        if (!res.status) {
            toast.error("Unable to get categories");
            return;
        }
        setCategories(
            res.data.map((c: any) => ({
                ...c,
                name: c.categoryName,
                type: "category",
            }))
        );
    } catch (error) {
        toast.error("Failed to fetch categories");
    }
};
export const fetchSubcategories = async (
    categoryId: string,
    token: string | null,
    setSubcategories: React.Dispatch<React.SetStateAction<any>>
) => {
    try {
        const res = await (window as any).electronAPI.getSubcategories(
            token,
            categoryId
        );
        if (!res.status) {
            toast.error("Unable to get subcategories");
            return;
        }
        setSubcategories(
            res.data.map((s: any) => ({
                ...s,
                type: "subcategory",
            }))
        );
    } catch (error) {
        toast.error("Failed to fetch subcategories");
    }
};
export const fetchProducts = async (
    token: string | null,
    setProducts: React.Dispatch<React.SetStateAction<any>>
) => {
    try {
        const res = await (window as any).electronAPI.getAllProducts(token);
        if (!res.status) {
            toast.error("Unable to get products");
            return;
        }
        setProducts(
            res.data.map((p: any) => ({
                ...p,
                type: "product",
            }))
        );
    } catch (error) {
        toast.error("Failed to fetch products");
    }
};
export const fetchProductsByCatId = async (
    token: string | null,
    catId: string,
    setProducts: React.Dispatch<React.SetStateAction<any>>
) => {
    try {
        const res = await (window as any).electronAPI.getProductsByCatId(
            token,
            catId
        );
        if (!res.status) {
            toast.error("Unable to get products");
            return;
        }
        setProducts(
            res.data.map((p: any) => ({
                ...p,
                type: "product",
            }))
        );
    } catch (error) {
        toast.error("Failed to fetch products");
    }
};

export const fetchProductsForOrder = async (
    token: string,
    setProducts: React.Dispatch<React.SetStateAction<any>>
) => {
    try {
        const res = await (window as any).electronAPI.getAllProducts(token);
        if (!res.status) {
            toast.error("Unable to get products");
            return;
        }
        setProducts(
            res.data
                .filter((p: any) => !p.isForMenu)
                .map((p: any) => ({
                    ...p,
                    type: "product",
                }))
        );
    } catch (error) {
        toast.error("Failed to fetch products");
    }
};

export const fetchProductsByCatIdForOrder = async (
    token: string | null,
    catId: string,
    setProducts: React.Dispatch<React.SetStateAction<any>>
) => {
    try {
        const res = await (window as any).electronAPI.getProductsByCatId(
            token,
            catId
        );
        if (!res.status) {
            toast.error("Unable to get products");
            return;
        }
        setProducts(
            res.data
                .filter((p: any) => !p.isForMenu)
                .map((p: any) => ({
                    ...p,
                    type: "product",
                }))
        );
    } catch (error) {
        toast.error("Failed to fetch products");
    }
};

export const fetchMenusBySubcategory = async (
    token: string | null,
    subcategoryId: string,
    setMenus: React.Dispatch<React.SetStateAction<any>>
) => {
    try {
        const res = await (window as any).electronAPI.getMenusBySubcategory(
            token,
            subcategoryId
        );
        if (!res.status) {
            toast.error("Unable to get menus");
            return;
        }
        setMenus(
            res.data.map((m: any) => {
                return {
                    ...m,
                    type: "menu",
                    price:
                        typeof m.price === "string"
                            ? parseFloat(m.price)
                            : m.price || 0,
                };
            })
        );
    } catch (error) {
        toast.error("Failed to fetch menus");
    }
};
export const fetchAssociatedProductsByVariantId = async (
    token: string | null,
    variantId: string,
    setAssociatedProducts: React.Dispatch<React.SetStateAction<any>>
) => {
    try {
        const response = await (
            window as any
        ).electronAPI.getAssociatedProductsByVariantId(token, variantId);
        if (!response.status) {
            toast.error("Failed to fetch associated products");
            return;
        } else {
            setAssociatedProducts(response.data);
        }
        return {
            status:true,
            data:response.data
        };
      } catch (error) {
        toast.error("Failed to fetch associated products");
        return {
            status:false
        };
    }
};
