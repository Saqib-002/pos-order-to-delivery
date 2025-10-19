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
  imgUrl?: string;
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
  const [processedCounts, setProcessedCounts] = useState<
    Record<string, number>
  >({});
  const {
    order,
    removeMenuFromOrder,
    setSelectedProduct,
    removeMenuItemFromOrder,
    processedMenuOrderItems,
    getMaxSecondaryId,
    selectedMenu,
    setSelectedMenu,
    setMode,
    editingGroup,
    setEditingProduct,
  } = useOrder();
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
      const allProductsRes = await (window as any).electronAPI.getAllProducts(
        token
      );
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
                          productPriority: product.priority,
                          imgUrl:
                            product.imgUrl || product.imageUrl || product.image, // Try multiple possible image field names
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
  const processedCountsForCurrent =
    processedCounts[currentMenuPage?.id || ""] || 0;
  const allPagesComplete = menuPages.every(
    (page: MenuPage) => (processedCounts[page.id] || 0) >= page.minComplements
  );
  const totalProcessed = Object.values(processedCounts).reduce(
    (a, b) => a + b,
    0
  );
  useEffect(() => {
    fetchMenuPages();
    setMaxSecondaryId(getMaxSecondaryId(selectedMenu.id));
  }, []);
  useEffect(() => {
    if (currentMenuPage && (processedMenuOrderItems || editingGroup)) {
      const orderPairs = new Set([
        ...processedMenuOrderItems.map(
          (item) => `${item.productId}-${item.menuPageId}`
        ),
        ...(editingGroup?.items || []).map(
          (item: any) => `${item.productId}-${item.menuPageId}`
        ),
      ]);
      const processedProducts = currentMenuPage.products.filter((product) => {
        const pairKey = `${product.productId}-${product.menuPageId}`;
        return orderPairs.has(pairKey);
      });
      setProcessedMenuProducts(
        new Set(processedProducts.map((product) => product.productId))
      );
    }
  }, [processedMenuOrderItems, currentMenuPage, editingGroup]);
  useEffect(() => {
    if (menuPages.length > 0 && (processedMenuOrderItems || editingGroup)) {
      const orderPairs = new Set([
        ...processedMenuOrderItems.map(
          (item) => `${item.productId}-${item.menuPageId}`
        ),
        ...(editingGroup?.items || []).map(
          (item: any) => `${item.productId}-${item.menuPageId}`
        ),
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
    // Check if order is assigned to a delivery person
    if (order && order.deliveryPerson && order.deliveryPerson.id) {
      toast.info(
        "This order is assigned to a delivery person and cannot be edited."
      );
      return;
    }

    if (currentMax <= processedCountsForCurrent) {
      toast.warn(
        "You have reached the maximum number of complements for this menu page"
      );
      return;
    }
    const res = await (window as any).electronAPI.getProductById(
      token,
      product.productId
    );
    if (!res.status) {
      toast.error("Unable to fetch product");
      return;
    }
    setSelectedProduct(res.data);
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
    });
    setMode("menu");
  };
  const resetMenuProcessing = () => {
    setProcessedMenuProducts(new Set());
    setCurrentMenuPageIndex(0);
    setProcessedCounts({});
    setSelectedMenu(null);
    setSelectedProduct(null);
  };
  const handleCancel = async () => {
    if (order && order.deliveryPerson && order.deliveryPerson.id) {
      toast.info(
        "This order is assigned to a delivery person and cannot be edited."
      );
      return;
    }

    if (totalProcessed !== 0) {
      const res = await (window as any).electronAPI.removeMenuFromOrder(
        token,
        order?.id,
        selectedMenu.id,
        editingGroup?.secondaryId || maxSecondaryId
      );
      if (!res.status) {
        toast.error("Error removing menu from order");
        return;
      }
      removeMenuFromOrder(
        selectedMenu.id,
        editingGroup?.secondaryId || maxSecondaryId
      );
    }
    resetMenuProcessing();
  };
  const handleRemoveMenuItem = async (menuProduct: MenuPageProduct) => {
    if (order && order.deliveryPerson && order.deliveryPerson.id) {
      toast.info(
        "This order is assigned to a delivery person and cannot be edited."
      );
      return;
    }

    if (menuProduct.menuPageId !== undefined) {
      const res = await (window as any).electronAPI.removeMenuItemFromOrder(
        token,
        order?.id,
        selectedMenu.id,
        editingGroup?.secondaryId || maxSecondaryId,
        menuProduct.productId,
        menuProduct.menuPageId
      );
      if (!res.status) {
        toast.error("Error removing menu item from order");
        return;
      }
      removeMenuItemFromOrder(
        selectedMenu.id,
        editingGroup?.secondaryId || maxSecondaryId,
        menuProduct.productId,
        menuProduct.menuPageId
      );
    }
  };
  const handleEditMenuItem = async (menuProduct: MenuPageProduct) => {
    if (menuProduct.menuPageId !== undefined) {
      const editingItem = editingGroup.items.find(
        (item: any) =>
          item.productId === menuProduct.productId &&
          item.menuPageId === menuProduct.menuPageId
      );
      const res = await (window as any).electronAPI.getProductById(
        token,
        menuProduct.productId
      );
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
      });
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modern Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <DocumentIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedMenu.name}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-600">
                  {menuPages.length > 0
                    ? `Page ${currentMenuPageIndex + 1} of ${menuPages.length}`
                    : "No pages available"}
                </span>
                {menuPages.length > 0 && (
                  <div className="flex space-x-1">
                    {menuPages.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentMenuPageIndex
                            ? "bg-indigo-600"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCancel()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <CrossIcon className="w-6 h-6" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {menuPages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <DocumentIcon className="size-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No Menu Pages
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                This menu has no pages configured yet. Please add some menu
                pages to get started.
              </p>
            </div>
          ) : currentMenuPage ? (
            <>
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentMenuPage.name}
                    </h3>
                    {currentMenuPage.description && (
                      <p className="text-gray-600 text-lg leading-relaxed">
                        {currentMenuPage.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Selection Progress
                    </span>
                    <span className="text-sm font-semibold text-indigo-600">
                      {processedMenuProducts.size}/{currentMin}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((processedMenuProducts.size / currentMin) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {processedMenuProducts.size > 0 ? (
                      processedMenuProducts.size < currentMin ? (
                        <span className="text-amber-600">
                          Select {currentMin - processedMenuProducts.size} more
                          product
                          {currentMin - processedMenuProducts.size !== 1
                            ? "s"
                            : ""}{" "}
                          to continue.
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">
                          ✓ Selection complete! You can now proceed.
                        </span>
                      )
                    ) : (
                      `Select ${currentMin > 0 ? `at least ${currentMin}` : "any"} product${currentMin !== 1 ? "s" : ""} to get started`
                    )}
                  </p>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {currentMenuPage.products
                  .sort((a, b) => a.priority - b.priority)
                  .map((menuProduct) => (
                    <div
                      key={menuProduct.id}
                      onClick={() => {
                        if (!processedMenuProducts.has(menuProduct.productId)) {
                          handleMenuProductSelect(menuProduct);
                        }
                      }}
                      className={`group relative touch-manipulation border-2 rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] ${
                        processedMenuProducts.has(menuProduct.productId)
                          ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100/50"
                          : "border-gray-200 hover:border-indigo-300 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 hover:shadow-xl hover:shadow-indigo-100/50 cursor-pointer"
                      }`}
                    >
                      {/* Status Badge */}
                      {processedMenuProducts.has(menuProduct.productId) && (
                        <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {menuProduct.imgUrl ? (
                          <img
                            src={menuProduct.imgUrl}
                            alt={menuProduct.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                        ) : null}
                        {/* Fallback placeholder */}
                        <div
                          className={`w-full h-full flex items-center justify-center ${menuProduct.imgUrl ? "hidden" : ""}`}
                        >
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gray-300 rounded-xl flex items-center justify-center mx-auto mb-2">
                              <svg
                                className="w-6 h-6 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                              No Image
                            </p>
                          </div>
                        </div>

                        {/* Price Badge Overlay */}
                        {Number(menuProduct.supplement || 0) > 0 && (
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-lg">
                              +€{Number(menuProduct.supplement || 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Content */}
                      <div className="p-3">
                        {/* Product Header */}
                        <div className="mb-2">
                          <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors line-clamp-1">
                            {menuProduct.name}
                          </h4>
                          {menuProduct.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {menuProduct.description}
                            </p>
                          )}
                        </div>

                        {/* Action Area */}
                        <div className="flex items-center justify-between">
                          {processedMenuProducts.has(menuProduct.productId) ? (
                            <>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-semibold text-green-700">
                                  Processed
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMenuItem(menuProduct);
                                  }}
                                  className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all duration-200 touch-manipulation"
                                >
                                  <EditIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveMenuItem(menuProduct);
                                  }}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 touch-manipulation"
                                >
                                  <CrossIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center space-x-2 text-indigo-600 group-hover:text-indigo-700 transition-colors">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              <span className="text-sm font-medium">
                                Click to select
                              </span>
                            </div>
                          )}
                        </div>
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
                      onClick={() => {
                        resetMenuProcessing();
                        setProcessedMenuProducts(new Set());
                      }}
                      type="button"
                      variant="green"
                      label={`Complete Menu (${totalProcessed} products)`}
                    />
                  ) : (
                    <CustomButton
                      onClick={() => {
                        handleCancel();
                      }}
                      type="button"
                      variant="secondary"
                      label="Cancel"
                    />
                  )}
                  {currentMenuPageIndex > 0 && (
                    <CustomButton
                      onClick={() => {
                        setCurrentMenuPageIndex((prev) => prev - 1);
                      }}
                      type="button"
                      label="Previous Page"
                      className="font-medium"
                    />
                  )}
                  {!isLastPage && (
                    <CustomButton
                      onClick={() => {
                        setCurrentMenuPageIndex((prev) => prev + 1);
                      }}
                      type="button"
                      label="Next Page"
                      className="font-medium"
                    />
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
  );
};

export default MenuOrderTakingForm;
