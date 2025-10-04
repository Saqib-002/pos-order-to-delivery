import { Product } from "@/types/Menu";
import { Group } from "@/types/groups";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useOrder } from "../../contexts/OrderContext";
import { ComplementsToString } from "@/renderer/utils/order";
import { calculateBaseProductPrice, calculateProductTaxAmount } from "@/renderer/utils/utils";
import { OrderItem } from "@/types/order";

interface OrderTakingFormProps {
  mode: "menu" | "product";
  product: Product | null;
  setProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  token: string | null;
  currentOrderItem: any
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
  currentOrderItem
}: OrderTakingFormProps) => {
  const { orderItems, addToOrder, order, setOrder } = useOrder();
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
        toast.warning(
          `Maximum ${maxComplements} items allowed for the group`
        );
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
    if(mode==="menu"){
      orderItem={
        ...orderItem,
        menuId:currentOrderItem.menuId,
        menuDescription:currentOrderItem.menuDescription,
        menuName:currentOrderItem.menuName,
        menuPageId:currentOrderItem.menuPageId,
        menuPageName:currentOrderItem.menuPageName,
        menuPrice:currentOrderItem.menuPrice,
        menuDiscount:currentOrderItem.menuDiscount,
        menuTax:currentOrderItem.menuTax,
        supplement:currentOrderItem.supplement,
      }
    }
    const newComplement = ComplementsToString(orderItem.complements);
    if (orderItems.length === 0) {
      const res = await (window as any).electronAPI.saveOrder(token, { ...orderItem, complements: newComplement });
      if (!res.status) {
        toast.error("Unable to save order");
        return;
      }
      addToOrder({ ...orderItem, id: res.data.itemId });
      setOrder(res.data.order);
    } else {
      const res = await (window as any).electronAPI.addItemToOrder(token, order!.id, { ...orderItem, complements: newComplement });
      if (!res.status) {
        toast.error("Unable to update order");
        return;
      }
      addToOrder({ ...orderItem, id: res.data.itemId });
    }
    toast.success("Item added to order!");
    setProduct(null);
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
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-indigo-500">
              {product?.name}
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
                Choose the variant of {product?.name}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {variantItems.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedVariant?.id === item.id
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

          {/* Complements Section - All Pages */}
          {addOnPages && addOnPages.length > 0 && groups && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Complements
              </h3>
              {addOnPages.map((page, index) => {
                const group = groups.find((g) => g.id === page.selectedGroup);
                if (!group) return null;
                return (
                  <div key={page.id || index} className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {group.name.toUpperCase()}
                    </h3>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">
                          Select the ones you want
                        </p>
                        <p className="text-sm font-medium text-gray-800">
                          {selectedComplements[group.id]?.length || 0} selected
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {page.minComplements > 0 && (
                          <span
                            className={`px-2 py-1 rounded-full font-medium ${(selectedComplements[group.id]?.length || 0) >= page.minComplements
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}
                          >
                            Min: {page.minComplements}
                          </span>
                        )}
                        {page.maxComplements > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            Max: {page.maxComplements}
                          </span>
                        )}
                        {page.freeAddons > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                            Free: {page.freeAddons}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {group.items?.map((item) => {
                        const isSelected =
                          selectedComplements[group.id]?.includes(item.id) ||
                          false;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleComplementToggle(group.id, item.id)}
                            className={`p-3 border rounded-lg text-left transition-colors ${isSelected
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
                );
              })}
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
                <span>€{calculateBaseProductPrice(product).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax ({product?.tax || 0}%):</span>
                <span>€{calculateProductTaxAmount(product).toFixed(2)}</span>
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

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setProduct(null)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAddToOrder}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg font-medium ${canProceed()
                ? "bg-indigo-500 text-white hover:bg-indigo-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              Add to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTakingForm;