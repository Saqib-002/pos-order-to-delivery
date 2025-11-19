import { OrderItem } from "@/types/order";
import React from "react";
import { toast } from "react-toastify";
import {
  calculateOrderTotal,
  calculateTaxPercentage,
} from "@/renderer/utils/orderCalculations";
import { useConfirm } from "@/renderer/hooks/useConfirm";
import CustomButton from "../ui/CustomButton";
import {
  ChevronLeftIcon,
  CrossIcon,
  DeleteIcon,
  EditIcon,
  PrinterIcon,
  CopyIcon,
} from "@/renderer/public/Svg";
import { useOrder } from "@/renderer/contexts/OrderContext";
import {
  generateReceiptHTML,
  groupItemsByPrinter,
} from "@/renderer/utils/printer";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { calculatePaymentStatus } from "@/renderer/utils/paymentStatus";
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { useTranslation } from "react-i18next";
import { useOrderManagementContext } from "@/renderer/contexts/orderManagementContext";
import { StringToComplements } from "@/renderer/utils/order";
import { formatAddress } from "@/renderer/utils/utils";

interface OrderCartProps {
  orderId: string;
  orderItems: OrderItem[];
  onRemoveItem: (itemId: string | undefined) => void;
  onUpdateQuantity: (itemId: string | undefined, quantity: number) => void;
  onClearOrder: () => void;
  onProcessOrder: () => void;
}

const OrderCart: React.FC<OrderCartProps> = ({
  orderId,
  orderItems,
  onRemoveItem,
  onUpdateQuantity,
  onClearOrder,
  onProcessOrder,
}) => {
  const { t } = useTranslation();
  const { orderTotal, nonMenuItems, groups } = calculateOrderTotal(orderItems);
  const {
    setSelectedMenu,
    setSelectedProduct,
    setEditingGroup,
    setEditingProduct,
    order,
    setMode,
    clearOrder,
    clearOrderItems,
    addToOrder,
    addToProcessedMenuOrderItems,
    clearProcessedMenuOrderItems,
  } = useOrder();
  const confirm = useConfirm();
  const { configurations } = useConfigurations();
  const { refreshOrdersCallback } = useOrderManagementContext();
  const {
    auth: { user, token },
  } = useAuth();
  const handlePrint = async () => {
    const printerGroups = groupItemsByPrinter(orderItems);
    if (!Object.keys(printerGroups).length) {
      toast.warn(t("orderCart.warnings.noPrintersAttached"));
      return;
    }
    let configurations = {
      name: t("orderCart.pointOfSale"),
      address: t("orderCart.defaultAddress"),
      logo: "",
      id: "",
    };
    let res = await (window as any).electronAPI.getConfigurations(token);
    if (!res.status) {
      toast.error(t("orderCart.errors.errorGettingConfigurations"));
      return;
    }
    if (res.data) {
      configurations = res.data;
    }

    toast.info(t("orderCart.messages.printingCustomerReceipt"));
    for (const [printer, items] of Object.entries(printerGroups)) {
      const printerName = printer.split("|")[0];
      const printerIsMain = printer.split("|")[1];
      let receiptHTML = "";
      const { status } = calculatePaymentStatus(
        order?.paymentType || "",
        orderTotal
      );
      if (printerIsMain === "true") {
        receiptHTML = generateReceiptHTML(
          items,
          configurations,
          order!.orderId,
          order?.orderType,
          user!.role,
          status,
          t,
          order?.customer && order?.customer.address
            ? formatAddress(order.customer.address)
            : undefined
        );
      }
      if (!receiptHTML) {
        continue;
      }
      const res = await (window as any).electronAPI.printToPrinter(
        token,
        printerName,
        { html: receiptHTML }
      );
      if (!res.status) {
        if (res.error === t("orderCart.errors.printerNotFoundError")) {
          toast.error(t("orderCart.errors.printerNotFound", { printerName }));
        } else {
          toast.error(t("orderCart.errors.errorPrintingReceipt"));
        }
        return;
      }
    }
    toast.success(t("orderCart.messages.receiptPrintedSuccessfully"));
  };
  const handleRemoveItem = async (itemId: string, itemName: string) => {
    const ok = await confirm({
      title: t("orderCart.confirmations.removeItem.title"),
      message: t("orderCart.confirmations.removeItem.message"),
      type: "danger",
      confirmText: t("orderCart.confirmations.removeItem.confirmText"),
      cancelText: t("common.cancel"),
      itemName: itemName,
    });
    if (!ok) {
      return;
    }
    const res = await (window as any).electronAPI.removeItemFromOrder(
      token,
      orderId,
      itemId
    );
    if (!res.status) {
      toast.error(t("orderCart.errors.errorRemovingItem"));
      return;
    }
    onRemoveItem(itemId);
  };
  const handleEditItem = async (item: any) => {
    const res = await (window as any).electronAPI.getProductById(
      token,
      item.productId
    );
    if (!res.status) {
      toast.error(t("orderCart.errors.errorGettingProduct"));
      return;
    }
    setMode("product");
    setEditingProduct(item);
    setSelectedProduct(res.data);
  };
  const handleRemoveGroup = async (group: any) => {
    const ok = await confirm({
      title: t("orderCart.confirmations.removeMenu.title"),
      message: t("orderCart.confirmations.removeMenu.message"),
      type: "danger",
      confirmText: t("orderCart.confirmations.removeMenu.confirmText"),
      cancelText: t("common.cancel"),
      itemName: group.menuName,
    });
    if (!ok) {
      return;
    }
    const res = await (window as any).electronAPI.removeMenuFromOrder(
      token,
      orderId,
      group.menuId,
      group.secondaryId
    );
    if (!res.status) {
      toast.error(t("orderCart.errors.errorRemovingItem"));
      return;
    }
    group.items.forEach((item: any) => onRemoveItem(item.id));
  };
  const handleEditGroup = async (group: any) => {
    const res = await (window as any).electronAPI.getMenuById(
      token,
      group.menuId
    );
    if (!res.status) {
      toast.error(t("orderCart.errors.errorGettingMenu"));
      return;
    }
    if (!res.data) {
      toast.error(t("orderCart.errors.menuHaveBeenDeleted"));
      return;
    }
    clearProcessedMenuOrderItems();
    group.items.forEach((item: OrderItem) => {
      addToProcessedMenuOrderItems({
        ...item,
        complements: Array.isArray(item.complements) ? item.complements : [],
      });
    });
    setMode("menu");
    setEditingGroup(group);
    setSelectedMenu(res.data);
    setSelectedProduct(null);
  };

  const handleDuplicateGroup = async (group: any) => {
    try {
      const res = await (window as any).electronAPI.duplicateMenuInOrder(
        token,
        orderId,
        group.menuId,
        group.secondaryId
      );

      if (res.status) {
        toast.success(t("orderCart.messages.menuDuplicated"));
        const itemsRes = await (window as any).electronAPI.getOrderItems(
          token,
          orderId
        );

        if (itemsRes.status) {
          clearOrderItems();
          itemsRes.data.forEach((item: any) => {
            addToOrder({
              ...item,
              complements: StringToComplements(item.complements),
            });
          });
        } else {
          throw new Error("Failed to refresh order items");
        }
      } else {
        throw new Error(res.error || "Failed to duplicate menu");
      }
    } catch (error) {
      console.error("Error duplicating menu:", error);
      toast.error(t("orderCart.errors.errorDuplicatingMenu"));
    }
  };

  const handleUpdateGroupQuantity = async (group: any, quantity: number) => {
    const res = await (window as any).electronAPI.updateMenuQuantity(
      token,
      orderId,
      group.menuId,
      group.secondaryId,
      quantity
    );
    if (!res.status) {
      toast.error(t("orderCart.errors.errorUpdatingQuantity"));
      return;
    }
    group.items.forEach((item: any) => onUpdateQuantity(item.id, quantity));
  };

  const handleClearOrder = async () => {
    const ok = await confirm({
      title: t("orderCart.confirmations.clearOrder.title"),
      message: t("orderCart.confirmations.clearOrder.message"),
      type: "danger",
      confirmText: t("orderCart.confirmations.clearOrder.confirmText"),
      cancelText: t("common.cancel"),
    });
    if (!ok) {
      return;
    }
    const res = await (window as any).electronAPI.deleteOrder(token, orderId);
    if (!res.status) {
      toast.error(t("orderCart.errors.errorClearingOrder"));
      return;
    }
    onClearOrder();
  };

  const handleUpdateQuantity = async (
    itemId: string | undefined,
    quantity: number
  ) => {
    const res = await (window as any).electronAPI.updateItemQuantity(
      token,
      itemId,
      quantity
    );
    if (!res.status) {
      toast.error(t("orderCart.errors.errorUpdatingQuantity"));
      return;
    }
    onUpdateQuantity(itemId, quantity);
  };

  if (orderItems.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 p-4 h-[calc(100vh-9rem)]">
        <div className="text-4xl mb-2">🛒</div>
        <p className="text-lg font-medium">
          {t("orderCart.yourOrder")}
          {configurations?.orderPrefix}
          {order?.orderId}
        </p>
        <p className="text-sm">{t("orderCart.selectItemsFromMenu")}</p>
      </div>
    );
  }
  return (
    <div className="row-span-12 flex flex-col overflow-y-auto py-2">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pb-2">
        <span className="flex gap-1">
          <CustomButton
            type="button"
            onClick={() => {
              onClearOrder();
              refreshOrdersCallback();
            }}
            Icon={<ChevronLeftIcon className="size-6" />}
            className="!p-0 !m-0"
            variant="transparent"
          />
          <h2 className="text-lg font-semibold text-gray-800">
            {t("orderCart.yourOrder")} {configurations?.orderPrefix || "K"}
            {order?.orderId}
          </h2>
        </span>
        <div className="flex items-center gap-1">
          <CustomButton
            type="button"
            onClick={handlePrint}
            title={t("orderCart.printOptions")}
            Icon={<PrinterIcon className="size-5" />}
            className="!px-2"
            variant="transparent"
          />
          <CustomButton
            type="button"
            onClick={handleClearOrder}
            title={t("orderCart.clearOrder")}
            Icon={<DeleteIcon className="size-5" />}
            className="!px-2 text-red-600 hover:text-red-700"
            variant="transparent"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {/* Non-Menu Items */}
        {nonMenuItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-3 relative"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">
                  {item.productName}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>{t("orderCart.itemPrice")}</span>
                    <span>
                      €{(item.productPrice + item.productTax).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    {item.variantId && (
                      <>
                        <span>
                          {t("orderCart.variant")}: {item.variantName}
                        </span>
                        <span>€{item.variantPrice.toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>
                {item.complements.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 font-medium">
                      {t("orderCart.addOns")}:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {item.complements.map((complement, index) => (
                        <li key={index} className="flex justify-between">
                          <span>• {complement.itemName}</span>
                          <span>€{complement.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="ml-2 flex gap-2 absolute top-2 right-4">
                <CustomButton
                  type="button"
                  onClick={() => handleEditItem(item)}
                  variant="transparent"
                  Icon={<EditIcon className="size-4" />}
                  className="!p-0"
                />
                <CustomButton
                  type="button"
                  onClick={() =>
                    handleRemoveItem(item.id || "", item.productName)
                  }
                  className="!p-0 text-sm text-red-500 hover:text-red-700"
                  variant="transparent"
                  label="✕"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleUpdateQuantity(
                      item.id,
                      Math.max(1, item.quantity - 1)
                    )
                  }
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50 cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.id, item.quantity + 1)
                  }
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50 cursor-pointer"
                >
                  +
                </button>
              </div>
              <span className="font-semibold text-gray-800">
                €
                {(
                  (item.productPrice +
                    item.productTax -
                    item.productDiscount +
                    item.variantPrice +
                    (Array.isArray(item.complements)
                      ? item.complements.reduce(
                          (sum, complement) => sum + complement.price,
                          0
                        )
                      : 0)) *
                  item.quantity
                ).toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        {/* Menu Groups */}
        {groups.map((group) => {
          const sectionQuantity = group.items[0]?.quantity || 1;
          const menuGroupPrice =
            (group.basePrice + group.taxPerUnit + group.supplementTotal) *
            sectionQuantity;
          const variantsAndComplementsTotal = group.items.reduce(
            (itemTotal, item) => {
              const complementsTotal = Array.isArray(item.complements)
                ? item.complements.reduce(
                    (sum, complement) => sum + complement.price,
                    0
                  )
                : 0;

              return (
                itemTotal +
                ((item.variantPrice || 0) + complementsTotal) * item.quantity
              );
            },
            0
          );

          const sectionTotal = menuGroupPrice + variantsAndComplementsTotal;
          return (
            <div
              key={group.key}
              className="bg-white border border-gray-200 rounded-lg mb-3"
            >
              <div className="p-3 bg-gray-50 rounded-t-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-800">
                    {t("orderCart.from")} {group.menuName} - {group.secondaryId}
                  </h3>
                  <div className="flex gap-2">
                    <CustomButton
                      type="button"
                      onClick={() => handleEditGroup(group)}
                      variant="transparent"
                      Icon={<EditIcon className="size-4" />}
                      className="!p-0"
                      title={t("common.edit")}
                    />
                    <CustomButton
                      type="button"
                      onClick={() => handleDuplicateGroup(group)}
                      variant="transparent"
                      Icon={<CopyIcon className="size-4" />}
                      className="!p-0 text-blue-600 hover:text-blue-800"
                      title={t("common.duplicate")}
                    />
                    <CustomButton
                      type="button"
                      onClick={() => handleRemoveGroup(group)}
                      className="!p-1 !rounded-full !text-sm bg-red-500 text-white hover:!text-gray-100 hover:bg-red-700"
                      variant="transparent"
                      Icon={<CrossIcon className="size-4" />}
                      title={t("common.remove")}
                    />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>{t("orderCart.menuPrice")}</span>
                    <span>
                      €{(group.basePrice + group.taxPerUnit).toFixed(2)}
                    </span>
                  </div>
                  {group.supplementTotal > 0.01 && (
                    <div className="flex justify-between">
                      <span>{t("orderCart.supplements")}</span>
                      <span>€{group.supplementTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t("orderCart.total")}</span>
                    <span className="font-semibold text-gray-800">
                      €{sectionTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() =>
                      handleUpdateGroupQuantity(
                        group,
                        Math.max(1, sectionQuantity - 1)
                      )
                    }
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {sectionQuantity}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateGroupQuantity(group, sectionQuantity + 1)
                    }
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {group.items.map((item) => (
                  <div key={item.id} className="border-t border-gray-200 pt-3">
                    <div className="flex justify-start items-start mb-2">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-800">
                            {item.productName}
                          </h3>
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-gray-100 text-black text-xs px-2 py-1 rounded-full">
                              {item.menuPageName}
                            </span>
                            {item.supplement && Number(item.supplement) > 0 ? (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                +€{item.supplement.toFixed(2)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {/* <div className="flex justify-between">
                            <span>Base Product</span>
                            <span>€{item.productPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Tax</span>
                            <span>€{item.productTax.toFixed(2)}</span>
                          </div> */}
                          {item.variantName && item.variantId && (
                            <div className="flex justify-between">
                              <span>
                                {t("orderCart.variant")}: {item.variantName}
                              </span>
                              <span>€{item.variantPrice.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        {item.complements.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 font-medium">
                              {t("orderCart.addOns")}:
                            </p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {item.complements.map((complement, index) => (
                                <li
                                  key={index}
                                  className="flex justify-between"
                                >
                                  <span>• {complement.itemName}</span>
                                  <span>€{complement.price.toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 px-4">
        <div className="flex justify-between text-lg font-semibold mb-4">
          <span>{t("orderCart.total")}:</span>
          <span className="text-black">€{orderTotal.toFixed(2)}</span>
        </div>
        <CustomButton
          label={t("orderCart.processOrder")}
          type="button"
          className="w-full"
          onClick={onProcessOrder}
        />
      </div>
    </div>
  );
};

export default OrderCart;
