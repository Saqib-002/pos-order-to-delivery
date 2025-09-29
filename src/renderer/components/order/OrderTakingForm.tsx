import { Product } from "@/types/Menu";
import { Variant, VariantItem } from "@/types/Variants";
import { Group, GroupItem } from "@/types/groups";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useOrder } from "../../contexts/OrderContext";

interface OrderTakingFormProps {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  token: string | null;
}

interface MenuPageProduct {
  id: string;
  productId: string;
  name: string;
  supplement: number;
  priority: number;
}

interface MenuPage {
  id: string;
  name: string;
  description?: string;
  products: MenuPageProduct[];
  minComplements: number;
  maxComplements: number;
}

interface AddonPage {
  id: string;
  minComplements: number;
  maxComplements: number;
  freeAddons: number;
  selectedGroup: string;
  pageNo: number;
}

interface OrderItem {
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
}

const OrderTakingForm = ({
  product,
  setProduct,
  token,
}: OrderTakingFormProps) => {
  const { addToOrder } = useOrder();
  const [variantItems, setVariantItems] = useState<any[] | null>(null);
  const [addOnPages, setAddonPages] = useState<AddonPage[] | null>(null);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [menuPages, setMenuPages] = useState<MenuPage[]>([]);
  const [currentMenuPageIndex, setCurrentMenuPageIndex] = useState(0);
  const [selectedMenuProducts, setSelectedMenuProducts] = useState<Set<string>>(
    new Set()
  );
  const [isMenuMode, setIsMenuMode] = useState(false);
  const [currentMenuProduct, setCurrentMenuProduct] = useState<any>(null);
  const [processedMenuProducts, setProcessedMenuProducts] = useState<
    Set<string>
  >(new Set());
  const [menuMinRequired, setMenuMinRequired] = useState(0);
  const [menuMaxAllowed, setMenuMaxAllowed] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [selectedComplements, setSelectedComplements] = useState<{
    [groupId: string]: string[];
  }>({});
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const getVariantAndGroups = async () => {
    try {
      setIsLoading(true);

      // Get variants
      const res = await (window as any).electronAPI.getVariantsByProductId(
        token,
        product.id
      );
      if (!res.status) {
        toast.error("Unable to get product's variants");
        return;
      }
      setVariantItems(res.data);

      // Get addon pages
      const groupRes = await (
        window as any
      ).electronAPI.getAddOnPagesByProductId(token, product.id);
      if (!groupRes.status) {
        toast.error("Unable to get product's addon pages");
        return;
      }
      setAddonPages(
        groupRes.data.map((page: any) => ({
          id: page.id,
          minComplements: page.minComplements,
          maxComplements: page.maxComplements,
          freeAddons: page.freeAddons,
          selectedGroup: page.selectedGroup,
          pageNo: page.pageNo,
        }))
      );

      // Get all groups
      const groupsRes = await (window as any).electronAPI.getGroups(token);
      if (!groupsRes.status) {
        toast.error("Unable to get groups");
        return;
      }
      setGroups(groupsRes.data);

      // Set default variant if available
      if (res.data.length > 0) {
        setSelectedVariant(res.data[0]);
      }
    } catch (error) {
      toast.error("Error loading product data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuPages = async () => {
    if (!token || !(product as any).menuId) {
      console.log("Missing token or menuId:", {
        token: !!token,
        menuId: (product as any).menuId,
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching menu pages for menu:", (product as any).menuId);

      // Get menu page associations for this menu
      const associationsRes = await (
        window as any
      ).electronAPI.getMenuPageAssociations(token, (product as any).menuId);
      console.log("Menu page associations response:", associationsRes);

      if (!associationsRes.status) {
        toast.error("Unable to get menu page associations");
        return;
      }

      // Get all menu pages
      const pagesRes = await (window as any).electronAPI.getMenuPages(token);
      console.log("All menu pages response:", pagesRes);

      if (!pagesRes.status) {
        toast.error("Unable to get menu pages");
        return;
      }

      // Filter pages that belong to this menu
      const associatedPageIds = associationsRes.data.map(
        (assoc: any) => assoc.menuPageId
      );
      console.log("Associated page IDs:", associatedPageIds);

      const filteredPages = pagesRes.data.filter((page: any) =>
        associatedPageIds.includes(page.id)
      );
      console.log("Filtered pages:", filteredPages);

      // Fetch products for each menu page
      const pagesWithProducts = await Promise.all(
        filteredPages.map(async (page: any) => {
          const productsRes = await (
            window as any
          ).electronAPI.getMenuPageProducts(token, page.id);

          // Find the association data for this page to get min/max values
          const association = associationsRes.data.find(
            (assoc: any) => assoc.menuPageId === page.id
          );

          // Fetch actual product details for each menu page product
          const productsWithDetails = productsRes.status
            ? await Promise.all(
                productsRes.data.map(async (menuProduct: any) => {
                  try {
                    // Get all products and find the one we need
                    const allProductsRes = await (
                      window as any
                    ).electronAPI.getAllProducts(token);
                    if (allProductsRes.status) {
                      const product = allProductsRes.data.find(
                        (p: any) => p.id === menuProduct.productId
                      );
                      if (product) {
                        return {
                          ...menuProduct,
                          name: product.name,
                          description: product.description,
                          price: product.price,
                          tax: product.tax,
                        };
                      }
                    }
                    return menuProduct;
                  } catch (error) {
                    console.error("Error fetching product details:", error);
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

      console.log("Final pages with products:", pagesWithProducts);
      setMenuPages(pagesWithProducts);
      setCurrentMenuPageIndex(0);

      // Set min/max requirements from the first page
      if (pagesWithProducts.length > 0) {
        setMenuMinRequired(pagesWithProducts[0].minComplements || 0);
        setMenuMaxAllowed(pagesWithProducts[0].maxComplements || 0);
      }
    } catch (error) {
      console.error("Error fetching menu pages:", error);
      toast.error("Failed to fetch menu pages");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (product && token) {
      // Check if this is a menu
      if ((product as any).isMenu) {
        setIsMenuMode(true);
        fetchMenuPages();
      } else {
        setIsMenuMode(false);
        getVariantAndGroups();
      }
    }
  }, [product, token]);

  const currentAddonPage = addOnPages?.[currentPage];
  const currentGroup = groups?.find(
    (g) => g.id === currentAddonPage?.selectedGroup
  );

  const handleVariantChange = (variantItem: any) => {
    setSelectedVariant(variantItem);
  };

  const handleComplementToggle = (itemId: string) => {
    if (!currentGroup) return;

    const groupId = currentGroup.id;
    const currentSelection = selectedComplements[groupId] || [];

    if (currentSelection.includes(itemId)) {
      // Remove from selection
      setSelectedComplements((prev) => ({
        ...prev,
        [groupId]: currentSelection.filter((id) => id !== itemId),
      }));
    } else {
      // Add to selection (check max limit)
      const maxComplements = currentAddonPage?.maxComplements || 0;
      if (currentSelection.length < maxComplements) {
        setSelectedComplements((prev) => ({
          ...prev,
          [groupId]: [...currentSelection, itemId],
        }));
      } else {
        toast.warning(
          `Maximum ${maxComplements} items allowed for ${currentGroup.name}`
        );
      }
    }
  };

  const canProceed = () => {
    if (!selectedVariant) return false;

    if (currentAddonPage) {
      const currentSelection =
        selectedComplements[currentAddonPage.selectedGroup] || [];
      const minComplements = currentAddonPage.minComplements || 0;
      return currentSelection.length >= minComplements;
    }

    return true;
  };

  const canGoNext = () => {
    return currentPage < (addOnPages?.length || 1) - 1;
  };

  const handleNext = () => {
    if (canGoNext()) {
      setCurrentPage((prev) => prev + 1);
    } else {
      handleAddToOrder();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedVariant) return 0;
    const productTaxRate = (product.tax || 0) / 100;
    const baseProductPrice = product.price / (1 + productTaxRate);
    const productTaxAmount = product.price - baseProductPrice;

    let total = baseProductPrice + (selectedVariant.price || 0);

    // Add complement prices
    Object.entries(selectedComplements).forEach(([groupId, itemIds]) => {
      const group = groups?.find((g) => g.id === groupId);
      if (group) {
        itemIds.forEach((itemId) => {
          const item = group.items?.find((i) => i.id === itemId);
          if (item) {
            total += item.price;
          }
        });
      }
    });

    // Add tax amount
    total += productTaxAmount;

    return Math.round(total * quantity * 100) / 100;
  };

  const calculateBaseProductPrice = () => {
    const productTaxRate = (product.tax || 0) / 100;
    return Math.round((product.price / (1 + productTaxRate)) * 100) / 100;
  };

  const calculateProductTaxAmount = () => {
    const productTaxRate = (product.tax || 0) / 100;
    return (
      Math.round((product.price - product.price / (1 + productTaxRate)) * 100) /
      100
    );
  };

  const resetMenuProcessing = () => {
    setProcessedMenuProducts(new Set());
    setMenuMinRequired(0);
    setMenuMaxAllowed(0);
    setCurrentMenuPageIndex(0);
  };

  const handleMenuProductSelect = async (menuProduct: any) => {
    try {
      // Get the actual product details
      const allProductsRes = await (window as any).electronAPI.getAllProducts(
        token
      );
      if (allProductsRes.status) {
        const actualProduct = allProductsRes.data.find(
          (p: any) => p.id === menuProduct.productId
        );
        if (actualProduct) {
          // Create a product object for the OrderTakingForm
          const productForForm = {
            ...actualProduct,
            isMenuProduct: true,
            menuContext: {
              menuId: (product as any).menuId,
              menuName: product.name,
              menuPageId: menuPages[currentMenuPageIndex].id,
              menuPageName: menuPages[currentMenuPageIndex].name,
              supplement: Number(menuProduct.supplement || 0),
            },
          };

          // Switch to regular product mode to process this product
          setCurrentMenuProduct(menuProduct);
          setIsMenuMode(false);
          setProduct(productForForm as any);

          // Load variants and groups for this product
          await getVariantAndGroups();
        }
      }
    } catch (error) {
      console.error("Error processing menu product:", error);
      toast.error("Failed to process menu product");
    }
  };

  const processMenuProducts = async () => {
    try {
      const currentMenuPage = menuPages[currentMenuPageIndex];
      if (!currentMenuPage) return;

      for (const productId of selectedMenuProducts) {
        const menuProduct = currentMenuPage.products.find(
          (p: any) => p.productId === productId
        );
        if (menuProduct) {
          // Get the actual product details
          const allProductsRes = await (
            window as any
          ).electronAPI.getAllProducts(token);
          if (allProductsRes.status) {
            const actualProduct = allProductsRes.data.find(
              (p: any) => p.id === productId
            );
            if (actualProduct) {
              // Calculate price with supplement
              const supplement = Number(menuProduct.supplement || 0);
              const totalPrice = actualProduct.price + supplement;
              const productTaxRate = (actualProduct.tax || 0) / 100;
              const baseProductPrice = totalPrice / (1 + productTaxRate);
              const productTaxAmount = totalPrice - baseProductPrice;

              // Add to order with menu context
              addToOrder({
                productId: actualProduct.id,
                productName: actualProduct.name,
                productPrice: Math.round(baseProductPrice * 100) / 100,
                productTax: Math.round(productTaxAmount * 100) / 100,
                variantId: "",
                variantName: "Default",
                variantPrice: 0,
                complements: [],
                quantity: 1,
                totalPrice: Math.round(totalPrice * 100) / 100,
                menuContext: {
                  menuId: (product as any).menuId,
                  menuName: product.name,
                  menuPageId: currentMenuPage.id,
                  menuPageName: currentMenuPage.name,
                  supplement: supplement,
                },
              });
            }
          }
        }
      }

      toast.success("Menu items added to order!");
      setProduct(null);
    } catch (error) {
      toast.error("Failed to add menu items to order");
    }
  };

  const handleAddToOrder = () => {
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }

    if (!canProceed()) {
      if (currentAddonPage && currentGroup) {
        const currentSelection =
          selectedComplements[currentAddonPage.selectedGroup] || [];
        const minComplements = currentAddonPage.minComplements || 0;
        if (currentSelection.length < minComplements) {
          toast.error(
            `Please select at least ${minComplements} items from ${currentGroup.name}`
          );
        } else {
          toast.error("Please complete all required selections");
        }
      } else {
        toast.error("Please complete all required selections");
      }
      return;
    }

    const orderItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      productPrice: calculateBaseProductPrice(),
      productTax: calculateProductTaxAmount(),
      variantId: selectedVariant.id,
      variantName: selectedVariant.name || `Variant ${selectedVariant.id}`,
      variantPrice: selectedVariant.price || 0,
      complements: Object.entries(selectedComplements).flatMap(
        ([groupId, itemIds]) => {
          const group = groups?.find((g) => g.id === groupId);
          if (!group) return [];

          return itemIds.map((itemId) => {
            const item = group.items?.find((i) => i.id === itemId);
            return {
              groupId,
              groupName: group.name,
              itemId,
              itemName: item?.name || "",
              price: item?.price || 0,
            };
          });
        }
      ),
      quantity,
      totalPrice: calculateTotalPrice(),
    };

    addToOrder(orderItem);
    toast.success("Item added to order!");

    // If this is a menu product, check if we need to continue processing
    if ((product as any).isMenuProduct) {
      // Add this product to processed list
      const newProcessed = new Set(processedMenuProducts);
      newProcessed.add(product.id);
      setProcessedMenuProducts(newProcessed);

      // Check if we've met the minimum requirement
      if (newProcessed.size >= menuMinRequired) {
        // Minimum met, close the modal
        resetMenuProcessing();
        setProduct(null);
        toast.success(
          `Menu processing complete! ${newProcessed.size} products processed.`
        );
      } else {
        // Need more products, go back to menu selection
        setIsMenuMode(true);
        setCurrentMenuProduct(null);
        // Reset form state
        setSelectedVariant(null);
        setSelectedComplements({});
        setQuantity(1);
        setCurrentPage(0);
        toast.info(
          `Processed ${newProcessed.size}/${menuMinRequired} products. Please select another product.`
        );
      }
    } else {
      setProduct(null);
    }
  };

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

  // Menu mode render
  if (isMenuMode) {
    const currentMenuPage = menuPages[currentMenuPageIndex];
    const isLastPage = currentMenuPageIndex === menuPages.length - 1;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-indigo-500">
                {product.name}
              </h2>
              <p className="text-gray-600">
                {menuPages.length > 0
                  ? `Page ${currentMenuPageIndex + 1} of ${menuPages.length}`
                  : "No pages available"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProduct(null)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

          <div className="p-6">
            {menuPages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
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
                        Processed {processedMenuProducts.size}/{menuMinRequired}{" "}
                        products.
                        {processedMenuProducts.size < menuMinRequired
                          ? " Select another product."
                          : " Complete!"}
                      </span>
                    ) : (
                      `Select ${menuMinRequired > 0 ? `at least ${menuMinRequired}` : "any"} product${menuMinRequired !== 1 ? "s" : ""}`
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
                        className={`border rounded-lg p-4 transition-all ${
                          processedMenuProducts.has(menuProduct.productId)
                            ? "border-green-300 bg-green-50 cursor-not-allowed opacity-60"
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
                        <div className="mt-2 text-sm font-medium">
                          {processedMenuProducts.has(menuProduct.productId) ? (
                            <span className="text-green-600">✓ Processed</span>
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
                    {currentMenuPageIndex > 0 && (
                      <button
                        onClick={() => {
                          setCurrentMenuPageIndex((prev) => prev - 1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Previous Page
                      </button>
                    )}
                    {!isLastPage && (
                      <button
                        onClick={() => {
                          setCurrentMenuPageIndex((prev) => prev + 1);
                        }}
                        className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600"
                      >
                        Next Page
                      </button>
                    )}
                    {processedMenuProducts.size >= menuMinRequired ? (
                      <button
                        onClick={() => {
                          resetMenuProcessing();
                          setProduct(null);
                        }}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                      >
                        Complete Menu ({processedMenuProducts.size} products)
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          resetMenuProcessing();
                          setProduct(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
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
  }

  // Regular product mode render
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-indigo-500">
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setProduct(null)}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          {/* Variants Section */}
          {variantItems && variantItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Variants
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose the variant of {product.name}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {variantItems.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedVariant?.id === item.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="variant"
                      value={item.id}
                      checked={selectedVariant?.id === item.id}
                      onChange={() => setSelectedVariant(item)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.name || `Variant ${item.id}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        €{item.price?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Complements Section */}
          {currentAddonPage && currentGroup && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {currentGroup.name.toUpperCase()}
              </h3>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">
                    Select the ones you want
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedComplements[currentGroup.id]?.length || 0} selected
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {currentAddonPage.minComplements > 0 && (
                    <span
                      className={`px-2 py-1 rounded-full font-medium ${
                        (selectedComplements[currentGroup.id]?.length || 0) >=
                        currentAddonPage.minComplements
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      Min: {currentAddonPage.minComplements}
                    </span>
                  )}
                  {currentAddonPage.maxComplements > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      Max: {currentAddonPage.maxComplements}
                    </span>
                  )}
                  {currentAddonPage.freeAddons > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      Free: {currentAddonPage.freeAddons}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currentGroup.items?.map((item) => {
                  const isSelected =
                    selectedComplements[currentGroup.id]?.includes(item.id) ||
                    false;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleComplementToggle(item.id)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        €{item.price.toFixed(2)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                -
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Product:</span>
                <span>€{calculateBaseProductPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax ({product.tax || 0}%):</span>
                <span>€{calculateProductTaxAmount().toFixed(2)}</span>
              </div>
              {selectedVariant && (
                <div className="flex justify-between">
                  <span>
                    Variant (
                    {selectedVariant.name || `Variant ${selectedVariant.id}`}):
                  </span>
                  <span>€{(selectedVariant.price || 0).toFixed(2)}</span>
                </div>
              )}
              {Object.entries(selectedComplements).map(([groupId, itemIds]) => {
                const group = groups?.find((g) => g.id === groupId);
                if (!group) return null;

                return itemIds.map((itemId) => {
                  const item = group.items?.find((i) => i.id === itemId);
                  if (!item) return null;

                  return (
                    <div
                      key={itemId}
                      className="flex justify-between text-gray-600"
                    >
                      <span>• {item.name}:</span>
                      <span>€{item.price.toFixed(2)}</span>
                    </div>
                  );
                });
              })}
              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between text-lg font-bold text-indigo-600">
                  <span>Total (×{quantity}):</span>
                  <span>€{calculateTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination Dots */}
          {addOnPages && addOnPages.length > 1 && (
            <div className="flex justify-center space-x-2 mb-6">
              {addOnPages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentPage ? "bg-indigo-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setProduct(null)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <div className="flex space-x-3">
              {currentPage > 0 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={`px-6 py-2 rounded-lg font-medium ${
                  canProceed()
                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {canGoNext() ? "Next" : "Add to Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTakingForm;
