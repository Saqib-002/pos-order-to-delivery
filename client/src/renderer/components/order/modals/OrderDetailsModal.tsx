import React from "react";
import { Order } from "@/types/order";
import { StringToComplements } from "../../../utils/order";
import {
  calculateOrderTotal,
  calculateTaxPercentage,
} from "../../../utils/orderCalculations";
import { calculatePaymentStatus } from "../../../utils/paymentStatus";
import { formatAddress } from "../../../utils/utils";
import {
  translateOrderStatus,
  translatePaymentStatus,
  getPaymentStatusStyle,
  translateOrderType,
  getOrderTypeStyle,
} from "@/renderer/utils/orderStatus";
import { useTranslation } from "react-i18next";
import { useConfigurations } from "../../../contexts/configurationContext";

const parseComplements = (complements: any) => {
  if (Array.isArray(complements)) return complements;

  if (typeof complements === "string") {
    return StringToComplements(complements);
  }

  return [];
};

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  view?: "kitchen" | "manage";
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  view = "kitchen",
}) => {
  const { t } = useTranslation();

  const receipt = () => {
    const { nonMenuItems, groups, orderTotal } = calculateOrderTotal(
      order.items || []
    );

    // Sort items by priority
    const prioritySort = (a: any, b: any) =>
      (a.productPriority || 0) - (b.productPriority || 0);
    const sortedNonMenuItems = nonMenuItems.sort(prioritySort);
    const sortedGroups = groups.map((group) => ({
      ...group,
      items: group.items.sort(prioritySort),
    }));

    const taxBreakdown: Record<
      string,
      { base: number; tax: number; rate: number }
    > = {};

    sortedGroups.forEach((group) => {
      const sectionQty = group.items[0]?.quantity || 1;
      const base = group.basePrice;
      const tax = group.taxPerUnit;
      const rate = calculateTaxPercentage(base, tax);
      const rateKey = `${Math.round(rate)}%`;

      if (!taxBreakdown[rateKey]) {
        taxBreakdown[rateKey] = {
          base: 0,
          tax: 0,
          rate: parseFloat(rateKey),
        };
      }
      taxBreakdown[rateKey].base += base * sectionQty;
      taxBreakdown[rateKey].tax += tax * sectionQty;
    });
    sortedNonMenuItems.forEach((item) => {
      const base = item.productPrice || 0;
      const tax = item.productTax || 0;
      const rate = calculateTaxPercentage(base, tax);
      const rateKey = `${Math.round(rate)}%`;

      if (!taxBreakdown[rateKey]) {
        taxBreakdown[rateKey] = {
          base: 0,
          tax: 0,
          rate: parseFloat(rateKey),
        };
      }
      taxBreakdown[rateKey].base += base * item.quantity;
      taxBreakdown[rateKey].tax += tax * item.quantity;
    });

    return (
      <div
        className="space-y-4"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
          {t("orderDetailsModal.orderItems")}
        </h3>

        {/* Receipt Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-base">
            <thead className="border-b border-black">
              <tr>
                <th className="w-[10%] text-center py-2 font-semibold">
                  {t("receipt.quantity")}
                </th>
                <th className="w-[50%] text-left py-2 font-semibold">
                  {t("receipt.name")}
                </th>
                <th className="w-[20%] text-right py-2 font-semibold">
                  {t("receipt.subtotal")}
                </th>
                <th className="w-[20%] text-right py-2 font-semibold">
                  {t("receipt.total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Menu Groups */}
              {sortedGroups.map((group, groupIndex) => {
                const sectionQty = group.items[0]?.quantity || 1;
                const menuPrice = group.basePrice;
                const menuTax = group.taxPerUnit;
                const supplementTotal = group.supplementTotal;
                const menuGroupPrice =
                  (menuPrice + menuTax + supplementTotal) * sectionQty;
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
                      ((item.variantPrice || 0) + complementsTotal) *
                        item.quantity
                    );
                  },
                  0
                );
                const totalGroupPrice =
                  menuGroupPrice + variantsAndComplementsTotal;

                return (
                  <React.Fragment key={groupIndex}>
                    <tr>
                      <td className="text-center py-1">{sectionQty}</td>
                      <td className="text-left py-1 font-bold">
                        {group.menuName}
                      </td>
                      <td className="text-right py-1">
                        €{menuPrice.toFixed(2)}
                      </td>
                      <td className="text-right py-1 font-bold">
                        €{totalGroupPrice.toFixed(2)}
                      </td>
                    </tr>
                    {group.items.map((item, itemIndex) => {
                      const parsedComplements = parseComplements(
                        item.complements
                      );
                      return (
                        <React.Fragment key={itemIndex}>
                          <tr>
                            <td></td>
                            <td className="pl-5 text-base">
                              {item.productName}{" "}
                              {item.variantName &&
                              item.variantId &&
                              item.variantName !== "0"
                                ? `(${item.variantName})`
                                : ""}
                            </td>
                            <td></td>
                            <td></td>
                          </tr>
                          {item.supplement != null && item.supplement > 0 && (
                            <tr>
                              <td></td>
                              <td className="pl-8 text-base">
                                {t("receipt.extra")}: {item.supplement}
                              </td>
                              <td></td>
                              <td className="text-right">
                                €{item.supplement.toFixed(2)}
                              </td>
                            </tr>
                          )}
                          {Number(item.variantPrice) > 0 &&
                            item.variantName &&
                            String(item.variantName).trim() !== "0" && (
                              <tr>
                                <td></td>
                                <td className="pl-8 text-base">
                                  {item.variantName}
                                </td>
                                <td></td>
                                <td className="text-right">
                                  €{item.variantPrice.toFixed(2)}
                                </td>
                              </tr>
                            )}

                          {parsedComplements.map((comp, compIndex) => (
                            <tr key={compIndex}>
                              <td></td>
                              <td className="pl-8 text-base">
                                {comp.itemName}
                              </td>
                              <td></td>
                              <td className="text-right">
                                €{comp.price.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Non-Menu Items */}
              {sortedNonMenuItems.map((item, index) => {
                const parsedComplements = parseComplements(item.complements);
                const complementsTotal = Array.isArray(item.complements)
                  ? item.complements.reduce(
                      (complementSum, complement) =>
                        complementSum + complement.price,
                      0
                    )
                  : 0;
                const subtotal =
                  item.productPrice +
                  item.productTax +
                  item.variantPrice +
                  complementsTotal;
                const discountAmount = (subtotal * item.productDiscount) / 100;
                const itemTotal = (subtotal - discountAmount) * item.quantity;
                const unitPrice = item.productPrice + item.productTax;

                return (
                  <React.Fragment key={index}>
                    <tr>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-left py-1 font-bold">
                        {item.productName}
                      </td>
                      <td className="text-right py-1">
                        €{unitPrice.toFixed(2)}
                      </td>
                      <td className="text-right py-1 font-bold">
                        €{itemTotal.toFixed(2)}
                      </td>
                    </tr>
                    {item.variantPrice && item.variantPrice > 0 && (
                      <tr>
                        <td></td>
                        <td className="pl-5 text-base">{item.variantName}</td>
                        <td></td>
                        <td className="text-right">
                          €{item.variantPrice.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {parsedComplements.map((comp, compIndex) => (
                      <tr key={compIndex}>
                        <td></td>
                        <td className="pl-5 text-base">{comp.itemName}</td>
                        <td></td>
                        <td className="text-right">€{comp.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Total Row */}
          <div className="border-t-2 border-black mt-4">
            <table className="w-full">
              <tr>
                <td className="w-[10%]"></td>
                <td className="w-[50%]"></td>
                <td className="w-[20%] text-right font-bold py-2">
                  {t("receipt.total")}
                </td>
                <td className="w-[20%] text-right font-bold py-2">
                  €{orderTotal.toFixed(2)}
                </td>
              </tr>
            </table>
          </div>

          {/* VAT Breakdown */}
          {Object.keys(taxBreakdown).length > 0 && (
            <>
              <div className="w-full h-px bg-black my-4"></div>
              <table className="w-full text-base">
                <thead className="border-b border-black">
                  <tr>
                    <th className="w-[50%] text-left py-2 font-semibold">
                      {t("receipt.vat")}
                    </th>
                    <th className="w-[25%] text-right py-2 font-semibold">
                      {t("receipt.base")}
                    </th>
                    <th className="w-[25%] text-right py-2 font-semibold">
                      {t("receipt.tax")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(taxBreakdown).map(
                    ([rateKey, { base, tax }]) => (
                      <tr key={rateKey}>
                        <td className="text-left py-1">{rateKey}</td>
                        <td className="text-right py-1">€{base.toFixed(2)}</td>
                        <td className="text-right py-1">€{tax.toFixed(2)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    );
  };

  const formatOrderNotes = (notes: string) => {
    if (!notes) return null;
    const noteSections = notes.split(/\n\n+/);

    return noteSections.map((section, index) => {
      const cancelledMatch = section.match(/^\[CANCELLED:\s*(.+?)\]\s*(.*)$/s);

      if (cancelledMatch) {
        const [, timestamp, noteText] = cancelledMatch;
        const cancelledDate = new Date(timestamp);
        const formattedDate = cancelledDate.toLocaleString();

        return (
          <div key={index} className="mb-4 last:mb-0">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-start gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {t("orderDetailsModal.cancelled") || "CANCELLED"}
                </span>
                <span className="text-xs text-gray-500">{formattedDate}</span>
              </div>
              {noteText.trim() && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {noteText.trim()}
                </p>
              )}
            </div>
          </div>
        );
      }

      return (
        <div key={index} className="mb-4 last:mb-0">
          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
            {section.trim()}
          </p>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black">
                {t("orderDetailsModal.title", { orderId: order.orderId })}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t("orderDetailsModal.created", {
                  date: new Date(order.createdAt || "").toLocaleString(),
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {view === "manage" ? (
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                  {t("orderDetailsModal.customerInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.name")}
                    </p>
                    <p className="text-black">{order.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.phone")}
                    </p>
                    <p className="text-black">{order.customer.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.address")}
                    </p>
                    <p className="text-black">
                      {formatAddress(order.customer.address)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div>
                <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                  {t("orderDetailsModal.orderInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.orderType")}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getOrderTypeStyle(order.orderType || "")}`}
                    >
                      {translateOrderType(order.orderType || "") ||
                        t("manageOrders.statuses.nA")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.status")}
                    </p>
                    <p className="text-black">
                      {translateOrderStatus(order.status || "")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.created")}
                    </p>
                    <p className="text-black">
                      {new Date(order.createdAt || "").toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.updated")}
                    </p>
                    <p className="text-black">
                      {order.updatedAt
                        ? new Date(order.updatedAt).toLocaleString()
                        : t("manageOrders.statuses.nA")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                  {t("orderDetailsModal.paymentInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.paymentStatus")}
                    </p>
                    {(() => {
                      const { orderTotal } = calculateOrderTotal(
                        order.items || []
                      );
                      const paymentStatus = calculatePaymentStatus(
                        order.paymentType || "",
                        orderTotal
                      );
                      return (
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusStyle(paymentStatus.status)}`}
                          >
                            {translatePaymentStatus(paymentStatus.status)}
                          </span>
                          {paymentStatus.status === "PARTIAL" && (
                            <span className="text-xs text-yellow-700">
                              €{paymentStatus.totalPaid.toFixed(2)} / €
                              {orderTotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("orderDetailsModal.totalAmount")}
                    </p>
                    <p className="text-black font-semibold">
                      €
                      {calculateOrderTotal(
                        order.items || []
                      ).orderTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {order.deliveryPerson && (
                <div>
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                    {t("orderDetailsModal.deliveryInformation")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t("orderDetailsModal.deliveryPerson")}
                      </p>
                      <p className="text-black">{order.deliveryPerson.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t("orderDetailsModal.phone")}
                      </p>
                      <p className="text-black">{order.deliveryPerson.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t("orderDetailsModal.vehicleType")}
                      </p>
                      <p className="text-black">
                        {order.deliveryPerson.vehicleType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t("orderDetailsModal.assignedAt")}
                      </p>
                      <p className="text-black">
                        {order.assignedAt
                          ? new Date(order.assignedAt).toLocaleString()
                          : order.status === "out for delivery" ||
                              order.status === "delivered"
                            ? t("orderDetailsModal.notRecorded")
                            : t("orderDetailsModal.notAssignedYet")}
                      </p>
                    </div>
                    {order.deliveredAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {t("orderDetailsModal.deliveredAt")}
                        </p>
                        <p className="text-black">
                          {new Date(order.deliveredAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items - Receipt Style */}
              {(() => receipt())()}

              {/* Notes */}
              {order.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2 mb-4">
                    {t("orderDetailsModal.orderNotes") || "Order Notes"}
                  </h3>
                  <div className="space-y-2">
                    {formatOrderNotes(order.notes)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Kitchen view - receipt style
            (() => receipt())()
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              {t("orderDetailsModal.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
