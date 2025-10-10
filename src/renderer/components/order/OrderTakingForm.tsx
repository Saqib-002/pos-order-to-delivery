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
import { AddIcon, CashIcon, CheckIcon, ClockIcon, CrossIcon } from "@/renderer/assets/Svg";
import CustomButton from "../ui/CustomButton";

interface OrderTakingFormProps {
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
  token,
  currentOrderItem,
}: OrderTakingFormProps) => {
  const {
    orderItems,
    addToOrder,
    order,
    setOrder,
    addToProcessedMenuOrderItems,
    findExactProductMatch,
    updateQuantity,
    selectedProduct,
    setSelectedProduct,
    mode,
    editingProduct,
    setEditingProduct,
    editOrderItem
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
        selectedProduct?.id
      );
      if (!res.status) {
        toast.error("Unable to get product's variants");
        return;
      }
      setVariantItems(res.data);

      // Get addon pages
      const groupRes = await (
        window as any
      ).electronAPI.getAddOnPagesByProductId(token, selectedProduct?.id);
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
        if (editingProduct) {
          const variant = res.data.find((v: any) => v.id === editingProduct.variantId);
          if (variant) {
            setSelectedVariant(variant);
          }
        } else {
          setSelectedVariant(res.data[0]);
        }
      }
    } catch (error) {
      toast.error("Error loading product data");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (selectedProduct && token) {
      getVariantAndGroups();
    }
  }, [selectedProduct, token]);
  useEffect(() => {
    if (editingProduct) {
      setQuantity(editingProduct.quantity);
      editingProduct.complements.forEach((complement: any) => {
        const currentSelection = selectedComplements[complement.groupId] || [];
        if (!currentSelection.includes(complement.itemId)) {
          setSelectedComplements((prev) => ({
            ...prev,
            [complement.groupId]: [...currentSelection, complement.itemId],
          }));
        }
      })
    }
  }, [addOnPages, editingProduct])
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
    const productTaxRate = (selectedProduct?.tax || 0) / 100;
    const baseProductPrice = selectedProduct!.price / (1 + productTaxRate);
    const productTaxAmount = selectedProduct!.price - baseProductPrice;

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

    const complements = Object.entries(selectedComplements).flatMap(
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
    );

    // Check if this is a menu item or regular product
    if (mode === "menu") {
      // For menu items, always add as new item (no duplicate checking)
      let orderItem: OrderItem = {
        productId: selectedProduct!.id,
        productName: selectedProduct?.name || "",
        productDescription: selectedProduct?.description || "",
        productPriority: selectedProduct?.priority || 0,
        productDiscount: selectedProduct?.discount || 0,
        productPrice: calculateBaseProductPrice(selectedProduct),
        productTax: calculateProductTaxAmount(selectedProduct),
        variantId: selectedVariant.id,
        variantName: selectedVariant.name || `Variant ${selectedVariant.id}`,
        variantPrice: selectedVariant.price || 0,
        complements,
        quantity,
        totalPrice: calculateTotalPrice(),
        menuId: currentOrderItem?.menuId,
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
        addToProcessedMenuOrderItems({ ...orderItem, id: res.data.itemId });
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
        addToProcessedMenuOrderItems({ ...orderItem, id: res.data.itemId });
        addToOrder({ ...orderItem, id: res.data.itemId });
      }
      toast.success("Item added to order!");
      setSelectedProduct(null);
      return;
    }

    // regular product
    const existingItem = findExactProductMatch(
      selectedProduct!.id,
      selectedVariant.id,
      complements
    );

    if (existingItem && !editingProduct) {
      // update quantity of existing item
      const newQuantity = quantity;

      // Update in database
      const res = await (window as any).electronAPI.updateItemQuantity(
        token,
        existingItem.id,
        newQuantity
      );

      if (!res.status) {
        toast.error("Unable to update quantity");
        return;
      }

      // Update local state
      updateQuantity(existingItem.id, newQuantity);
      toast.success(`Quantity updated! Total: ${newQuantity}`);
      setSelectedProduct(null);
      return;
    }

    // Add new item
    let orderItem: OrderItem = {
      productId: selectedProduct!.id,
      productName: selectedProduct?.name || "",
      productDescription: selectedProduct?.description || "",
      productPriority: selectedProduct?.priority || 0,
      productDiscount: selectedProduct?.discount || 0,
      productPrice: calculateBaseProductPrice(selectedProduct),
      productTax: calculateProductTaxAmount(selectedProduct),
      variantId: selectedVariant.id,
      variantName: selectedVariant.name || `Variant ${selectedVariant.id}`,
      variantPrice: selectedVariant.price || 0,
      complements,
      quantity,
      totalPrice: calculateTotalPrice(),
    };
    const newComplement = ComplementsToString(orderItem.complements);
    if (editingProduct) {
      const res = await (window as any).electronAPI.updateOrderItem(
        token,
        editingProduct.id,
        {
          ...orderItem,
          complements: newComplement,
        }
      )
      if (!res.status) {
        toast.error("Unable to update order");
      }
      setEditingProduct(null);
      setSelectedProduct(null);
      editOrderItem(editingProduct.id, orderItem);
      return;
    }
    if (orderItems.length === 0) {
      const res = await (window as any).electronAPI.saveOrder(token, {
        ...orderItem,
        complements: newComplement,
      });
      if (!res.status) {
        toast.error("Unable to save order");
        return;
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
      addToOrder({ ...orderItem, id: res.data.itemId });
    }
    toast.success("Item added to order!");
    setSelectedProduct(null);
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
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{selectedProduct?.name}</h2>
              <p className="text-indigo-100 text-sm">Customize your order</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedProduct(null)}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 touch-manipulation cursor-pointer"
          >
            <CrossIcon className="size-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 touch-pan-y">
          {/* Variants Section */}
          {variantItems && variantItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-2 bg-indigo-600"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Choose Variant
                </h3>
              </div>
              <p className="text-gray-600 ml-10">
                Select your preferred variant for {selectedProduct?.name}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-10">
                {variantItems.map((item) => (
                  <label
                    key={item.id}
                    className={`group relative flex items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md touch-manipulation ${selectedVariant?.id === item.id
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
                      className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${selectedVariant?.id === item.id
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
                  <div className="size-4 p-1 bg-green-600 flex items-center justify-center rounded-full">
                    <CheckIcon className="size-2 text-white" />
                  </div>
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
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${(selectedComplements[group.id]?.length || 0) >=
                            page.minComplements
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          <div className={`size-[14px] p-[2px] ${(selectedComplements[group.id]?.length || 0) >=
                            page.minComplements ? "bg-green-600" : "bg-red-600"} flex items-center justify-center rounded-full`}>
                            <CheckIcon className="size-2 text-white" />
                          </div>
                          <span>Min: {page.minComplements}</span>
                        </span>
                      )}
                      {page.maxComplements > 0 && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center space-x-1">
                          <span className="bg-blue-600 h-[2px] w-2"></span>
                          <span>Max: {page.maxComplements}</span>
                        </span>
                      )}
                      {page.freeAddons > 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center space-x-1">
                          <div className="size-[14px] p-[2px] bg-green-600 flex items-center justify-center rounded-full">
                            <CheckIcon className="size-2 text-white" />
                          </div>
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
                            className={`group relative p-5 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-md touch-manipulation min-h-[80px] ${isSelected
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
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                  ? "border-indigo-500 bg-indigo-500"
                                  : "border-gray-300 group-hover:border-indigo-400"
                                  }`}
                              >
                                {isSelected && (
                                  <CheckIcon className="size-4 text-white" />
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
                <ClockIcon className="size-4 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Quantity</h3>
            </div>
            <div className="flex items-center space-x-6">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-colors duration-200 group touch-manipulation"
              >
                <span className="bg-gray-600 group-hover:bg-indigo-600 h-[2px] w-4"></span>
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
                <AddIcon className="w-6 h-6 text-gray-600 group-hover:text-indigo-600" />
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <CashIcon className="size-4 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Price Breakdown
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Base Product:</span>
                <span className="font-semibold text-gray-900">
                  €{calculateBaseProductPrice(selectedProduct).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 text-gray-600">
                <span>Tax ({selectedProduct?.tax || 0}%):</span>
                <span>€{calculateProductTaxAmount(selectedProduct).toFixed(2)}</span>
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
            <CustomButton type="button" label="Cancel" onClick={() => setSelectedProduct(null)} className="flex-1 px-6 py-4" variant="secondary" />
            <CustomButton type="button" label={`${editingProduct ? "Edit" : "Add to Order"}`} onClick={handleAddToOrder} disabled={!canProceed()} variant={canProceed() ? "gradient" : "secondary"} Icon={
              <>
                {canProceed() &&
                  <div className="size-5 p-1 bg-white flex items-center justify-center rounded-full">
                    <CheckIcon className="size-3 text-indigo-600" />
                  </div>
                }</>
            } className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTakingForm;
