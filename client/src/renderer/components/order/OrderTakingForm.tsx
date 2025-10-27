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
import {
  AddIcon,
  CashIcon,
  CheckIcon,
  ClockIcon,
  CrossIcon,
} from "@/renderer/public/Svg";
import CustomButton from "../ui/CustomButton";
import { useTranslation } from "react-i18next";

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

const OrderTakingForm = ({ token, currentOrderItem }: OrderTakingFormProps) => {
  const { t } = useTranslation();
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
    editOrderItem,
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
        toast.error(t("orderTakingForm.errors.unableToGetVariants"));
        return;
      }
      setVariantItems(res.data);

      // Get addon pages
      const groupRes = await (
        window as any
      ).electronAPI.getAddOnPagesByProductId(token, selectedProduct?.id);
      if (!groupRes.status) {
        toast.error(t("orderTakingForm.errors.unableToGetAddonPages"));
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
        toast.error(t("orderTakingForm.errors.unableToGetGroups"));
        return;
      }
      setGroups(groupsRes.data);

      if (res.data.length > 0) {
        if (editingProduct) {
          const variant = res.data.find(
            (v: any) => v.id === editingProduct.variantId
          );
          if (variant) {
            setSelectedVariant(variant);
          }
        } else {
          setSelectedVariant(res.data[0]);
        }
      }
    } catch (error) {
      toast.error(t("orderTakingForm.errors.errorLoadingProductData"));
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
    if (editingProduct && addOnPages) {
      setQuantity(editingProduct.quantity);
      const newSelections: { [groupId: string]: string[] } = {};
      editingProduct.complements.forEach((complement: any) => {
        if (!newSelections[complement.groupId]) {
          newSelections[complement.groupId] = [];
        }
        if (!newSelections[complement.groupId].includes(complement.itemId)) {
          newSelections[complement.groupId].push(complement.itemId);
        }
      });
      setSelectedComplements(newSelections);
    } else if (!editingProduct) {
      setSelectedComplements({});
    }
  }, [addOnPages, editingProduct]);
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
        toast.warning(
          t("orderTakingForm.warnings.maximumItemsAllowed", { maxComplements })
        );
      }
    }
  };

  const canProceed = () => {
    if (variantItems?.length == 0) return true;
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
    // Check if order is assigned to a delivery person
    if (order && order.deliveryPerson && order.deliveryPerson.id) {
      toast.info(t("orderTakingForm.messages.orderAssignedToDeliveryPerson"));
      return;
    }
    if (!selectedVariant && variantItems!.length > 0) {
      toast.error(t("orderTakingForm.errors.pleaseSelectVariant"));
      return;
    }

    if (!canProceed()) {
      toast.error(t("orderTakingForm.errors.pleaseCompleteRequiredSelections"));
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
        variantId: selectedVariant?.id,
        variantName: selectedVariant?.name || `Variant ${selectedVariant?.id}`,
        variantPrice: selectedVariant?.price || 0,
        printers: selectedProduct?.printerIds,
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
      if (editingProduct) {
        const res = await (window as any).electronAPI.updateOrderItem(
          token,
          editingProduct.id,
          {
            ...orderItem,
            complements: newComplement,
          }
        );
        if (!res.status) {
          toast.error(t("orderTakingForm.errors.unableToUpdateOrder"));
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
          toast.error(t("orderTakingForm.errors.unableToSaveOrder"));
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
          toast.error(t("orderTakingForm.errors.unableToUpdateOrder"));
          return;
        }
        addToProcessedMenuOrderItems({ ...orderItem, id: res.data.itemId });
        addToOrder({ ...orderItem, id: res.data.itemId });
      }
      toast.success(t("orderTakingForm.messages.itemAddedToOrder"));
      setSelectedProduct(null);
      return;
    }

    // regular product
    const existingItem = findExactProductMatch(
      selectedProduct!.id,
      selectedVariant?.id || undefined,
      complements
    );
    if (existingItem && !editingProduct) {
      // update quantity of existing item
      const newQuantity = existingItem.quantity + quantity;

      // Update in database
      const res = await (window as any).electronAPI.updateItemQuantity(
        token,
        existingItem.id,
        newQuantity
      );

      if (!res.status) {
        toast.error(t("orderTakingForm.errors.unableToUpdateQuantity"));
        return;
      }

      // Update local state
      updateQuantity(existingItem.id, newQuantity);
      toast.success(
        t("orderTakingForm.messages.quantityUpdated", { newQuantity })
      );
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
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name || `Variant ${selectedVariant?.id}`,
      variantPrice: selectedVariant?.price || 0,
      printers: selectedProduct?.printerIds,
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
      );
      if (!res.status) {
        toast.error(t("orderTakingForm.errors.unableToUpdateOrder"));
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
        toast.error(t("orderTakingForm.errors.unableToSaveOrder"));
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
        toast.error(t("orderTakingForm.errors.unableToUpdateOrder"));
        return;
      }
      addToOrder({ ...orderItem, id: res.data.itemId });
    }
    toast.success(t("orderTakingForm.messages.itemAddedToOrder"));
    setSelectedProduct(null);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black mb-1">
                {t("orderTakingForm.loading.title")}
              </h3>
              <p className="text-sm text-gray-600">
                {t("orderTakingForm.loading.description")}
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
        <div className="relative bg-gradient-to-r from-black to-gray-800 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{selectedProduct?.name}</h2>
              <p className="text-gray-100 text-sm">
                {t("orderTakingForm.customizeYourOrder")}
              </p>
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
          {variantItems && variantItems.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-2 bg-gray-600"></div>
                </div>
                <h3 className="text-xl font-bold text-black">
                  {t("orderTakingForm.chooseVariant")}
                </h3>
              </div>
              <p className="text-gray-600 ml-10">
                {t("orderTakingForm.selectPreferredVariant", {
                  productName: selectedProduct?.name,
                })}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 ml-10">
                {variantItems.map((item) => (
                  <label
                    key={item.id}
                    className={`group relative flex flex-col p-2 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md touch-manipulation ${
                      selectedVariant?.id === item.id
                        ? "border-gray-500 bg-gray-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
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

                    {/* Image Section */}
                    <div className="relative mb-2">
                      <div className="w-full h-24 rounded-md overflow-hidden bg-gray-100">
                        {item.imgUrl ? (
                          <img
                            crossOrigin="anonymous"
                            src={item.imgUrl}
                            alt={item.name || `Variant ${item.id}`}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              console.error(
                                "Failed to load variant image:",
                                item.imgUrl
                              );
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                            onLoad={() => {
                              console.log(
                                "Successfully loaded variant image:",
                                item.imgUrl
                              );
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full flex items-center justify-center ${item.imgUrl ? "hidden" : ""}`}
                        >
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-gray-400"
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
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div
                        className={`absolute top-1 right-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedVariant?.id === item.id
                            ? "border-gray-500 bg-gray-500"
                            : "border-white bg-white shadow-sm group-hover:border-gray-400"
                        }`}
                      >
                        {selectedVariant?.id === item.id && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex items-center justify-between px-1">
                      <div className="font-medium text-black text-sm truncate flex-1">
                        {item.name || `Variant ${item.id}`}
                      </div>
                      <div className="text-sm font-bold text-gray-600 ml-2">
                        €{item.price?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-yellow-700 text-2xl">
              {t("orderTakingForm.variantsDetached")}
            </div>
          )}

          {/* Complements Section */}
          {addOnPages && addOnPages.length > 0 && groups ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="size-4 p-1 bg-green-600 flex items-center justify-center rounded-full">
                    <CheckIcon className="size-2 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-black">
                  {t("orderTakingForm.addComplements")}
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
                      <h4 className="text-lg font-bold text-black flex items-center space-x-2">
                        <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span>{group.name}</span>
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {t("orderTakingForm.selected")}:
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
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
                          <div
                            className={`size-[14px] p-[2px] ${
                              (selectedComplements[group.id]?.length || 0) >=
                              page.minComplements
                                ? "bg-green-600"
                                : "bg-red-600"
                            } flex items-center justify-center rounded-full`}
                          >
                            <CheckIcon className="size-2 text-white" />
                          </div>
                          <span>
                            {t("orderTakingForm.min")}: {page.minComplements}
                          </span>
                        </span>
                      )}
                      {page.maxComplements > 0 && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center space-x-1">
                          <span className="bg-blue-600 h-[2px] w-2"></span>
                          <span>
                            {t("orderTakingForm.max")}: {page.maxComplements}
                          </span>
                        </span>
                      )}
                      {page.freeAddons > 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center space-x-1">
                          <div className="size-[14px] p-[2px] bg-green-600 flex items-center justify-center rounded-full">
                            <CheckIcon className="size-2 text-white" />
                          </div>
                          <span>
                            {t("orderTakingForm.free")}: {page.freeAddons}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
                            className={`group relative flex flex-col p-3 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md touch-manipulation ${
                              isSelected
                                ? "border-gray-500 bg-gray-50 shadow-md"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            {/* Image Section */}
                            <div className="relative mb-2">
                              <div className="w-full h-20 rounded-md overflow-hidden bg-gray-100">
                                {item.imgUrl ? (
                                  <img
                                    crossOrigin="anonymous"
                                    src={item.imgUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    onError={(e) => {
                                      console.error(
                                        "Failed to load group item image:",
                                        item.imgUrl
                                      );
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      target.nextElementSibling?.classList.remove(
                                        "hidden"
                                      );
                                    }}
                                    onLoad={() => {
                                      console.log(
                                        "Successfully loaded group item image:",
                                        item.imgUrl
                                      );
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`w-full h-full flex items-center justify-center ${item.imgUrl ? "hidden" : ""}`}
                                >
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-4 h-4 text-gray-400"
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
                                </div>
                              </div>

                              {/* Selection Indicator */}
                              <div
                                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "border-gray-500 bg-gray-500"
                                    : "border-gray-300 bg-white shadow-sm group-hover:border-gray-400"
                                }`}
                              >
                                {isSelected && (
                                  <CheckIcon className="size-3 text-white" />
                                )}
                              </div>
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 flex items-center justify-between px-1">
                              <div className="font-medium text-black text-xs truncate flex-1">
                                {item.name}
                              </div>
                              <div className="text-sm font-bold text-black ml-2">
                                €{item.price.toFixed(2)}
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
          ) : (
            <div className="text-center text-yellow-700 text-2xl">
              {t("orderTakingForm.complementsDetached")}
            </div>
          )}
          {mode === "product" && (
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="size-4 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-black">
                  {t("orderTakingForm.quantity")}
                </h3>
              </div>
              <div className="flex items-center space-x-6">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-50 flex items-center justify-center transition-colors duration-200 group touch-manipulation"
                >
                  <span className="bg-gray-600 group-hover:bg-gray-600 h-[2px] w-4"></span>
                </button>
                <div className="w-20 h-14 bg-white border-2 border-gray-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">
                    {quantity}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-50 flex items-center justify-center transition-colors duration-200 group touch-manipulation"
                >
                  <AddIcon className="w-6 h-6 text-gray-600 group-hover:text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <CashIcon className="size-4 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-black">
                {t("orderTakingForm.priceBreakdown")}
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">
                  {t("orderTakingForm.baseProduct")}:
                </span>
                <span className="font-semibold text-black">
                  €{calculateBaseProductPrice(selectedProduct).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 text-gray-600">
                <span>
                  {t("orderTakingForm.tax")} ({selectedProduct?.tax || 0}%):
                </span>
                <span>
                  €{calculateProductTaxAmount(selectedProduct).toFixed(2)}
                </span>
              </div>

              {selectedVariant && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">
                    {t("orderTakingForm.variant")} (
                    {selectedVariant.name || `Variant ${selectedVariant.id}`}):
                  </span>
                  <span className="font-semibold text-black">
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
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        <span>{item.name}:</span>
                      </span>
                      <span>€{item.price.toFixed(2)}</span>
                    </div>
                  );
                });
              })}

              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-600">
                    {t("orderTakingForm.total")} (×{quantity}):
                  </span>
                  <span className="text-2xl font-bold text-gray-600">
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
            <CustomButton
              type="button"
              label={t("common.cancel")}
              onClick={() => setSelectedProduct(null)}
              className="flex-1 px-6 py-4"
              variant="secondary"
            />
            <CustomButton
              type="button"
              label={`${editingProduct ? t("common.edit") : t("orderTakingForm.addToOrder")}`}
              onClick={handleAddToOrder}
              disabled={!canProceed()}
              variant={canProceed() ? "gradient" : "secondary"}
              Icon={
                <>
                  {canProceed() && (
                    <div className="size-5 p-1 bg-white flex items-center justify-center rounded-full">
                      <CheckIcon className="size-3 text-gray-600" />
                    </div>
                  )}
                </>
              }
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTakingForm;
