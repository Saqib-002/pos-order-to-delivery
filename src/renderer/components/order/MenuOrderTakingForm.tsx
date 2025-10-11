import { CrossIcon, DocumentIcon, EditIcon } from "@/renderer/assets/Svg";
import { useOrder } from "@/renderer/contexts/OrderContext";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import CustomButton from "../ui/CustomButton";

interface MenuPageProduct {
    id: string;
    productId: string;
    name: string;
    supplement: number;
    priority: number;
    description?: string;
    price?: number;
    tax?: number;
    discount?: number;
    productPriority?: number;
    menuPageId?: string;
    totalPrice?: number;
}

interface MenuPage {
    id: string;
    name: string;
    description?: string;
    products: MenuPageProduct[];
    minComplements: number;
    maxComplements: number;
}
interface MenuOrderTakingFormProps {
    setCurrentOrderItem: React.Dispatch<React.SetStateAction<any>>;
    token: string | null;
}

const MenuOrderTakingForm = ({
    setCurrentOrderItem,
    token,
}: MenuOrderTakingFormProps) => {
    const [menuPages, setMenuPages] = useState<MenuPage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMenuPageIndex, setCurrentMenuPageIndex] = useState(0);
    const [processedMenuProducts, setProcessedMenuProducts] = useState<
        Set<string>
    >(new Set());
    const [processedCounts, setProcessedCounts] = useState<Record<string, number>>({});
    const { order, removeMenuFromOrder, setSelectedProduct, removeMenuItemFromOrder, processedMenuOrderItems, getMaxSecondaryId, selectedMenu, setSelectedMenu, setMode, editingGroup, setEditingProduct } = useOrder();
    const [maxSecondaryId, setMaxSecondaryId] = useState(0);

    const fetchMenuPages = async () => {
        if (!token || !selectedMenu) {
            console.log("Missing token or menuId:", {
                token: !!token,
                menuId: selectedMenu.id,
            });
            return;
        }
        try {
            setIsLoading(true);
            const associationsRes = await (
                window as any
            ).electronAPI.getMenuPageAssociations(token, selectedMenu.id);
            if (!associationsRes.status) {
                toast.error("Unable to get menu page associations");
                return;
            }
            const pagesRes = await (window as any).electronAPI.getMenuPages(token);
            if (!pagesRes.status) {
                toast.error("Unable to get menu pages");
                return;
            }
            const associatedPageIds = associationsRes.data.map(
                (assoc: any) => assoc.menuPageId
            );
            const filteredPages = pagesRes.data.filter((page: any) =>
                associatedPageIds.includes(page.id)
            );
            const allProductsRes = await (
                window as any
            ).electronAPI.getAllProducts(token);
            const pagesWithProducts = await Promise.all(
                filteredPages.map(async (page: any) => {
                    const productsRes = await (
                        window as any
                    ).electronAPI.getMenuPageProducts(token, page.id);
                    const association = associationsRes.data.find(
                        (assoc: any) => assoc.menuPageId === page.id
                    );
                    const productsWithDetails = productsRes.status
                        ? await Promise.all(
                            productsRes.data.map(async (menuProduct: any) => {
                                try {
                                    if (allProductsRes.status) {
                                        const product = allProductsRes.data.find(
                                            (p: any) => p.id === menuProduct.productId
                                        );
                                        if (product) {
                                            return {
                                                ...menuProduct,
                                                supplement: parseFloat(menuProduct.supplement),
                                                name: product.name,
                                                description: product.description,
                                                price: product.price,
                                                tax: product.tax,
                                                discount: product.discount,
                                                productPriority: product.priority
                                            };
                                        }
                                    }
                                    return menuProduct;
                                } catch (error) {
                                    return menuProduct;
                                }
                            })
                        )
                        : [];

                    return {
                        ...page,
                        products: productsWithDetails,
                        minComplements: association?.minimum || 0,
                        maxComplements: association?.maximum || 0,
                    };
                })
            );
            setMenuPages(pagesWithProducts);
            setCurrentMenuPageIndex(0);
        } catch (error) {
            toast.error("Failed to fetch menu pages");
        } finally {
            setIsLoading(false);
        }
    };
    const currentMenuPage = menuPages[currentMenuPageIndex];
    const isLastPage = currentMenuPageIndex === menuPages.length - 1;
    const currentMin = currentMenuPage?.minComplements || 0;
    const currentMax = currentMenuPage?.maxComplements || 0;
    const processedCountsForCurrent = processedCounts[currentMenuPage?.id || ''] || 0;
    const allPagesComplete = menuPages.every((page: MenuPage) => (processedCounts[page.id] || 0) >= page.minComplements);
    const totalProcessed = Object.values(processedCounts).reduce((a, b) => a + b, 0);
    useEffect(() => {
        fetchMenuPages();
        setMaxSecondaryId(getMaxSecondaryId(selectedMenu.id));
    }, [])
    useEffect(() => {
        if (currentMenuPage && (processedMenuOrderItems || editingGroup)) {
            const orderPairs = new Set([
                ...processedMenuOrderItems.map(item => `${item.productId}-${item.menuPageId}`),
                ...(editingGroup?.items || []).map((item: any) => `${item.productId}-${item.menuPageId}`)
            ]);
            const processedProducts = currentMenuPage.products.filter(product => {
                const pairKey = `${product.productId}-${product.menuPageId}`;
                return orderPairs.has(pairKey);
            }
            );
            setProcessedMenuProducts(new Set(processedProducts.map(product => product.productId)));
        }
    }, [processedMenuOrderItems, currentMenuPage, editingGroup])
    useEffect(() => {
        if (menuPages.length > 0 && (processedMenuOrderItems || editingGroup)) {
            const orderPairs = new Set([
                ...processedMenuOrderItems.map(item => `${item.productId}-${item.menuPageId}`),
                ...(editingGroup?.items || []).map((item: any) => `${item.productId}-${item.menuPageId}`)
            ]);
            const counts: Record<string, number> = {};
            menuPages.forEach((page: MenuPage) => {
                const pageCount = page.products.filter((product: MenuPageProduct) =>
                    orderPairs.has(`${product.productId}-${page.id}`)
                ).length;
                counts[page.id] = pageCount;
            });
            setProcessedCounts(counts);
        } else {
            setProcessedCounts({});
        }
    }, [processedMenuOrderItems, menuPages, editingGroup]);
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        <span className="ml-2">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }
    const handleMenuProductSelect = async (product: MenuPageProduct) => {
        if (currentMax <= processedCountsForCurrent) {
            toast.warn("You have reached the maximum number of complements for this menu page")
            return
        }
        const res = await (window as any).electronAPI.getProductById(token, product.productId);
        if (!res.status) {
            toast.error("Unable to fetch product")
            return;
        }
        setSelectedProduct(res.data)
        setEditingProduct(null);
        setCurrentOrderItem({
            menuId: selectedMenu.id,
            menuName: selectedMenu.name,
            menuDescription: selectedMenu.description,
            menuDiscount: parseFloat(selectedMenu.discount),
            menuPrice: parseFloat(selectedMenu.price),
            menuTax: parseFloat(selectedMenu.tax),
            menuPageId: currentMenuPage.id,
            menuPageName: currentMenuPage.name,
            supplement: product.supplement,
            menuSecondaryId: editingGroup?.secondaryId || maxSecondaryId + 1,
        })
        setMode("menu")
    }
    const resetMenuProcessing = () => {
        setProcessedMenuProducts(new Set());
        setCurrentMenuPageIndex(0);
        setProcessedCounts({});
        setSelectedMenu(null);
        setSelectedProduct(null);
    };
    const handleCancel = async () => {
        if (totalProcessed !== 0) {
            const res = await (window as any).electronAPI.removeMenuFromOrder(token, order?.id, selectedMenu.id, editingGroup?.secondaryId || maxSecondaryId);
            if (!res.status) {
                toast.error("Error removing menu from order");
                return;
            }
            removeMenuFromOrder(selectedMenu.id, editingGroup?.secondaryId || maxSecondaryId);
        }
        resetMenuProcessing();
    }
    const handleRemoveMenuItem = async (menuProduct: MenuPageProduct) => {
        if (menuProduct.menuPageId !== undefined) {
            const res = await (window as any).electronAPI.removeMenuItemFromOrder(token, order?.id, selectedMenu.id, editingGroup?.secondaryId || maxSecondaryId, menuProduct.productId, menuProduct.menuPageId);
            if (!res.status) {
                toast.error("Error removing menu item from order");
                return;
            }
            removeMenuItemFromOrder(selectedMenu.id, editingGroup?.secondaryId || maxSecondaryId, menuProduct.productId, menuProduct.menuPageId);
        }
    }
    const handleEditMenuItem = async (menuProduct: MenuPageProduct) => {
        if (menuProduct.menuPageId !== undefined) {
            const editingItem = editingGroup.items.find((item: any) => item.productId === menuProduct.productId && item.menuPageId === menuProduct.menuPageId);
            const res = await (window as any).electronAPI.getProductById(token, menuProduct.productId);
            if (!res.status) {
                toast.error(`Error getting product`);
                return;
            }
            setSelectedProduct(res.data);
            setEditingProduct(editingItem);
            setCurrentOrderItem({
                menuId: selectedMenu.id,
                menuName: selectedMenu.name,
                menuDescription: selectedMenu.description,
                menuDiscount: parseFloat(selectedMenu.discount),
                menuPrice: parseFloat(selectedMenu.price),
                menuTax: parseFloat(selectedMenu.tax),
                menuPageId: currentMenuPage.id,
                menuPageName: currentMenuPage.name,
                supplement: menuProduct.supplement,
                menuSecondaryId: editingGroup?.secondaryId || maxSecondaryId + 1,
            })
        }
    }
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-indigo-500">
                            {selectedMenu.name}
                        </h2>
                        <p className="text-gray-600">
                            {menuPages.length > 0
                                ? `Page ${currentMenuPageIndex + 1} of ${menuPages.length}`
                                : "No pages available"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleCancel()}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6">
                    {menuPages.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DocumentIcon className="size-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Menu Pages
                            </h3>
                            <p className="text-gray-500">
                                This menu has no pages configured yet.
                            </p>
                        </div>
                    ) : currentMenuPage ? (
                        <>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    {currentMenuPage.name}
                                </h3>
                                {currentMenuPage.description && (
                                    <p className="text-gray-600">
                                        {currentMenuPage.description}
                                    </p>
                                )}
                                <div className="mt-2 text-sm text-gray-500">
                                    {processedMenuProducts.size > 0 ? (
                                        <span>
                                            Processed {processedMenuProducts.size}/{currentMin} products.
                                            {processedMenuProducts.size < currentMin
                                                ? " Select another product."
                                                : " Complete!"}
                                        </span>
                                    ) : (
                                        `Select ${currentMin > 0 ? `at least ${currentMin}` : "any"} product${currentMin !== 1 ? "s" : ""}`
                                    )}
                                </div>
                            </div>

                            {/* Products Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {currentMenuPage.products
                                    .sort((a, b) => a.priority - b.priority)
                                    .map((menuProduct) => (
                                        <div
                                            key={menuProduct.id}
                                            onClick={() => {
                                                if (
                                                    !processedMenuProducts.has(menuProduct.productId)
                                                ) {
                                                    handleMenuProductSelect(menuProduct);
                                                }
                                            }}
                                            className={`touch-manipulation border rounded-lg p-4 transition-all ${processedMenuProducts.has(menuProduct.productId)
                                                ? "border-green-300 bg-green-50 opacity-60"
                                                : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-800">
                                                    {menuProduct.name}
                                                </h4>
                                                {Number(menuProduct.supplement || 0) > 0 && (
                                                    <span className="text-sm font-medium text-indigo-600">
                                                        +€{Number(menuProduct.supplement || 0).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {Number(menuProduct.supplement || 0) > 0
                                                    ? "Additional charge"
                                                    : "Included"}
                                            </div>
                                            <div className="mt-2 text-sm font-medium flex justify-between gap-2">
                                                {processedMenuProducts.has(menuProduct.productId) ? (
                                                    <>
                                                        <span className="text-green-600">✓ Processed</span>
                                                        <span className="flex gap-2">
                                                            <EditIcon className="size-6 text-indigo-500 hover:text-indigo-600 touch-manipulation cursor-pointer" onClick={() => handleEditMenuItem(menuProduct)} />
                                                            <CrossIcon className="size-6 text-red-500 hover:text-red-600 touch-manipulation cursor-pointer" onClick={() => handleRemoveMenuItem(menuProduct)} />
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-indigo-600">
                                                        Click to process
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Simple Navigation */}
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    Click on any product to process it
                                </div>
                                <div className="flex gap-3">
                                    {allPagesComplete ? (
                                        <CustomButton
                                            onClick={() => { resetMenuProcessing(); setProcessedMenuProducts(new Set()); }}
                                            type="button" variant="green" label={`Complete Menu (${totalProcessed} products)`} />
                                    ) : (
                                        <CustomButton
                                            onClick={() => { handleCancel() }}
                                            type="button" variant="secondary" label="Cancel" />
                                    )}
                                    {currentMenuPageIndex > 0 && (
                                        <CustomButton
                                            onClick={() => {
                                                setCurrentMenuPageIndex((prev) => prev - 1);
                                            }}
                                            type="button" label="Previous Page" className="font-medium" />
                                    )}
                                    {!isLastPage && (
                                        <CustomButton
                                            onClick={() => {
                                                setCurrentMenuPageIndex((prev) => prev + 1);
                                            }}
                                            type="button" label="Next Page" className="font-medium" />
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading menu pages...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MenuOrderTakingForm