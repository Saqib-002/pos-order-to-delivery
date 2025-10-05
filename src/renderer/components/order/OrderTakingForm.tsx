import { Product } from "@/types/Menu";
import { Group } from "@/types/groups";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useOrder } from "../../contexts/OrderContext";
import { ComplementsToString } from "@/renderer/utils/order";
import {
  calculateBaseProductPrice,
  calculateProductTaxAmount,
} from "@/renderer/utils/utils";
import { OrderItem } from "@/types/order";

interface OrderTakingFormProps {
  mode: "menu" | "product";
  product: Product | null;
  setProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  token: string | null;
  currentOrderItem: any;
}

interface AddonPage {
  id: string;
  minComplements: number;
  maxComplements: number;
  freeAddons: number;
  selectedGroup: string;
  pageNo: number;
}

const OrderTakingForm = ({
  mode,
  product,
  setProduct,
  token,
  currentOrderItem,
}: OrderTakingFormProps) => {
  const {
    orderItems,
    addToOrder,
    order,
    setOrder,
    addToProcessedMenuOrderItems,
  } = useOrder();
  const [variantItems, setVariantItems] = useState<any[] | null>(null);
  const [addOnPages, setAddonPages] = useState<AddonPage[] | null>(null);
  const [groups, setGroups] = useState<Group[] | null>(null);
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
        product?.id
      );
      if (!res.status) {
        toast.error("Unable to get product's variants");
        return;
      }
      setVariantItems(res.data);

      // Get addon pages
      const groupRes = await (
        window as any
      ).electronAPI.getAddOnPagesByProductId(token, product?.id);
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

      if (res.data.length > 0) {
        setSelectedVariant(res.data[0]);
      }
    } catch (error) {
      toast.error("Error loading product data");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (product && token) {
      getVariantAndGroups();
    }
  }, [product, token]);

  const handleComplementToggle = (groupId: string, itemId: string) => {
    const currentSelection = selectedComplements[groupId] || [];

    if (currentSelection.includes(itemId)) {
      setSelectedComplements((prev) => ({
        ...prev,
        [groupId]: currentSelection.filter((id) => id !== itemId),
      }));
    } else {
      // Add to selection (check max limit)
      const page = addOnPages?.find((p) => p.selectedGroup === groupId);
      if (!page) return;
      const maxComplements = page.maxComplements || 0;
      if (currentSelection.length < maxComplements) {
        setSelectedComplements((prev) => ({
          ...prev,
          [groupId]: [...currentSelection, itemId],
        }));
      } else {
        toast.warning(`Maximum ${maxComplements} items allowed for the group`);
      }
    }
  };

  const canProceed = () => {
    if (!selectedVariant) return false;

    if (addOnPages && addOnPages.length > 0) {
      return addOnPages.every((page) => {
        const groupId = page.selectedGroup;
        const currentSelection = selectedComplements[groupId] || [];
        const minComplements = page.minComplements || 0;
        return currentSelection.length >= minComplements;
      });
    }

    return true;
  };

  const calculateTotalPrice = () => {
    if (!selectedVariant) return 0;
    const productTaxRate = (product?.tax || 0) / 100;
    const baseProductPrice = product!.price / (1 + productTaxRate);
    const productTaxAmount = product!.price - baseProductPrice;

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

  const handleAddToOrder = async () => {
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }

    if (!canProceed()) {
      toast.error("Please complete all required selections");
      return;
    }

    let orderItem: OrderItem = {
      productId: product!.id,
      productName: product?.name || "",
      productDescription: product?.description || "",
      productPriority: product?.priority || 0,
      productDiscount: product?.discount || 0,
      productPrice: calculateBaseProductPrice(product),
      productTax: calculateProductTaxAmount(product),
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
              priority: item?.priority || 0,
            };
          });
        }
      ),
      quantity,
      totalPrice: calculateTotalPrice(),
    };
    if (mode === "menu") {
      orderItem = {
        ...orderItem,
        menuId: currentOrderItem.menuId,
        menuDescription: currentOrderItem.menuDescription,
        menuName: currentOrderItem.menuName,
        menuPageId: currentOrderItem.menuPageId,
        menuPageName: currentOrderItem.menuPageName,
        menuPrice: calculateBaseProductPrice({
          price: currentOrderItem.menuPrice,
          tax: currentOrderItem.menuTax,
        }),
        menuDiscount: currentOrderItem.menuDiscount,
        menuTax: calculateProductTaxAmount({
          price: currentOrderItem.menuPrice,
          tax: currentOrderItem.menuTax,
        }),
        supplement: currentOrderItem.supplement,
        menuSecondaryId: currentOrderItem.menuSecondaryId,
      };
    }
    const newComplement = ComplementsToString(orderItem.complements);
    if (orderItems.length === 0) {
      const res = await (window as any).electronAPI.saveOrder(token, {
        ...orderItem,
        complements: newComplement,
      });
      if (!res.status) {
        toast.error("Unable to save order");
        return;
      }
      if (mode === "menu") {
        addToProcessedMenuOrderItems({ ...orderItem, id: res.data.itemId });
      }
      addToOrder({ ...orderItem, id: res.data.itemId });
      setOrder(res.data.order);
    } else {
      const res = await (window as any).electronAPI.addItemToOrder(
        token,
        order!.id,
        { ...orderItem, complements: newComplement }
      );
      if (!res.status) {
        toast.error("Unable to update order");
        return;
      }
      if (mode === "menu") {
        addToProcessedMenuOrderItems({ ...orderItem, id: res.data.itemId });
      }
      addToOrder({ ...orderItem, id: res.data.itemId });
    }
    toast.success("Item added to order!");
    setProduct(null);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Loading Product Details
              </h3>
              <p className="text-sm text-gray-600">
                Please wait while we fetch the customization options...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modern Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{product?.name}</h2>
                <p className="text-indigo-100 text-sm">Customize your order</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProduct(null)}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 touch-manipulation"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 touch-pan-y">
          {/* Variants Section */}
          {variantItems && variantItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Choose Variant
                </h3>
              </div>
              <p className="text-gray-600 ml-10">
                Select your preferred variant for {product?.name}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-10">
                {variantItems.map((item) => (
                  <label
                    key={item.id}
                    className={`group relative flex items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md touch-manipulation ${
                      selectedVariant?.id === item.id
                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                        : "border-gray-200 hover:border-indigo-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="variant"
                      value={item.id}
                      checked={selectedVariant?.id === item.id}
                      onChange={() => setSelectedVariant(item)}
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${
                        selectedVariant?.id === item.id
                          ? "border-indigo-500 bg-indigo-500"
                          : "border-gray-300 group-hover:border-indigo-400"
                      }`}
                    >
                      {selectedVariant?.id === item.id && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {item.name || `Variant ${item.id}`}
                      </div>
                      <div className="text-lg font-bold text-indigo-600">
                        €{item.price?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Complements Section */}
          {addOnPages && addOnPages.length > 0 && groups && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Add Complements
                </h3>
              </div>

              {addOnPages.map((page, index) => {
                const group = groups.find((g) => g.id === page.selectedGroup);
                if (!group) return null;
                return (
                  <div
                    key={page.id || index}
                    className="bg-gray-50 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                        <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span>{group.name}</span>
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Selected:</span>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                          {selectedComplements[group.id]?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="flex flex-wrap gap-2">
                      {page.minComplements > 0 && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
                            (selectedComplements[group.id]?.length || 0) >=
                            page.minComplements
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Min: {page.minComplements}</span>
                        </span>
                      )}
                      {page.maxComplements > 0 && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center space-x-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Max: {page.maxComplements}</span>
                        </span>
                      )}
                      {page.freeAddons > 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center space-x-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Free: {page.freeAddons}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {group.items?.map((item) => {
                        const isSelected =
                          selectedComplements[group.id]?.includes(item.id) ||
                          false;
                        return (
                          <button
                            key={item.id}
                            onClick={() =>
                              handleComplementToggle(group.id, item.id)
                            }
                            className={`group relative p-5 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-md touch-manipulation min-h-[80px] ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-50 shadow-md"
                                : "border-gray-200 hover:border-indigo-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 mb-1">
                                  {item.name}
                                </div>
                                <div className="text-lg font-bold text-indigo-600">
                                  €{item.price.toFixed(2)}
                                </div>
                              </div>
                              <div
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "border-indigo-500 bg-indigo-500"
                                    : "border-gray-300 group-hover:border-indigo-400"
                                }`}
                              >
                                {isSelected && (
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
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quantity Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Quantity</h3>
            </div>
            <div className="flex items-center space-x-6">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-colors duration-200 group touch-manipulation"
              >
                <svg
                  className="w-6 h-6 text-gray-600 group-hover:text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <div className="w-20 h-14 bg-white border-2 border-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {quantity}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-colors duration-200 group touch-manipulation"
              >
                <svg
                  className="w-6 h-6 text-gray-600 group-hover:text-indigo-600"
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
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Price Breakdown
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Base Product:</span>
                <span className="font-semibold text-gray-900">
                  €{calculateBaseProductPrice(product).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 text-gray-600">
                <span>Tax ({product?.tax || 0}%):</span>
                <span>€{calculateProductTaxAmount(product).toFixed(2)}</span>
              </div>

              {selectedVariant && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">
                    Variant (
                    {selectedVariant.name || `Variant ${selectedVariant.id}`}):
                  </span>
                  <span className="font-semibold text-gray-900">
                    €{(selectedVariant.price || 0).toFixed(2)}
                  </span>
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
                      className="flex justify-between items-center py-1 text-gray-600"
                    >
                      <span className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                        <span>{item.name}:</span>
                      </span>
                      <span>€{item.price.toFixed(2)}</span>
                    </div>
                  );
                });
              })}

              <div className="border-t-2 border-indigo-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-indigo-600">
                    Total (×{quantity}):
                  </span>
                  <span className="text-2xl font-bold text-indigo-600">
                    €{calculateTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Action Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setProduct(null)}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 touch-manipulation min-h-[56px] text-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddToOrder}
              disabled={!canProceed()}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 min-h-[56px] text-lg ${
                canProceed()
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl touch-manipulation"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {canProceed() && (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>Add to Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTakingForm;
