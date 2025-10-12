import React, { useState } from "react";
import { Order } from "@/types/order";
import { calculateOrderTotal } from "../../../utils/orderCalculations";
import { calculatePaymentStatus } from "../../../utils/paymentStatus";
import { updateOrder } from "../../../utils/order";
import { toast } from "react-toastify";
import CustomInput from "../../shared/CustomInput";
import { CustomSelect } from "../../ui/CustomSelect";
import PersonIcon from "../../../assets/icons/person.svg?react";
import ThunderIcon from "../../../assets/icons/thunder.svg?react";

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  deliveryPersons: Array<{ id: string; name: string }>;
  token: string;
  refreshOrdersCallback: () => void;
}

const BulkPaymentModal: React.FC<BulkPaymentModalProps> = ({
  isOpen,
  onClose,
  orders,
  deliveryPersons,
  token,
  refreshOrdersCallback,
}) => {
  const [selectedBulkDeliveryPerson, setSelectedBulkDeliveryPerson] =
    useState("");
  const [bulkPaymentMethods, setBulkPaymentMethods] = useState<
    Array<{ type: string; amount: number }>
  >([]);
  const [bulkCurrentAmount, setBulkCurrentAmount] = useState("");
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<"cash" | "card">(
    "cash"
  );

  // Parse existing payments from payment string
  const parseExistingPayments = (paymentTypeString: string) => {
    if (!paymentTypeString || paymentTypeString.trim() === "") {
      return [];
    }

    try {
      const payments = paymentTypeString.split(", ").map((payment) => {
        const [type, amount] = payment.split(":");
        const numericAmount = parseFloat(amount);

        if (isNaN(numericAmount)) {
          console.warn(`Invalid payment amount: ${amount}`);
          return { type: type.trim(), amount: 0 };
        }

        return { type: type.trim(), amount: numericAmount };
      });

      return payments;
    } catch (error) {
      console.error(
        "Error parsing existing payment string:",
        paymentTypeString,
        error
      );
      return [];
    }
  };

  // Get orders for bulk payment processing
  const getOrdersForDeliveryPerson = (deliveryPersonId: string) => {
    return orders.filter((order) => {
      if (
        !order.deliveryPerson ||
        order.deliveryPerson.id !== deliveryPersonId
      ) {
        return false;
      }

      // Only include orders that are delivered and have unpaid/partial payments
      const { orderTotal } = calculateOrderTotal(order.items || []);
      const paymentStatus = calculatePaymentStatus(
        order.paymentType || "",
        orderTotal
      );

      return (
        order.status === "delivered" &&
        (paymentStatus.status === "UNPAID" ||
          paymentStatus.status === "PARTIAL")
      );
    });
  };

  // Calculate total amount for bulk payment
  const getBulkPaymentTotal = (deliveryPersonId: string) => {
    const ordersForDelivery = getOrdersForDeliveryPerson(deliveryPersonId);
    return ordersForDelivery.reduce((total, order) => {
      const { orderTotal } = calculateOrderTotal(order.items || []);
      const paymentStatus = calculatePaymentStatus(
        order.paymentType || "",
        orderTotal
      );
      return total + paymentStatus.remainingAmount;
    }, 0);
  };

  const handleBulkAddPayment = () => {
    const amount = parseFloat(bulkCurrentAmount);
    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!selectedBulkDeliveryPerson) {
      toast.error("Please select a delivery person first");
      return;
    }

    const totalAmount = getBulkPaymentTotal(selectedBulkDeliveryPerson);
    const totalPaid = bulkPaymentMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );

    if (totalPaid + amount > totalAmount) {
      toast.error("Total payment cannot exceed remaining amount");
      return;
    }

    const existingMethodIndex = bulkPaymentMethods.findIndex(
      (method) => method.type === bulkPaymentMethod
    );

    if (existingMethodIndex !== -1) {
      const updatedMethods = [...bulkPaymentMethods];
      updatedMethods[existingMethodIndex].amount += amount;
      setBulkPaymentMethods(updatedMethods);
    } else {
      setBulkPaymentMethods([
        ...bulkPaymentMethods,
        { type: bulkPaymentMethod, amount: amount },
      ]);
    }

    setBulkCurrentAmount("");
  };

  const handleBulkRemovePayment = (index: number) => {
    setBulkPaymentMethods(bulkPaymentMethods.filter((_, i) => i !== index));
  };

  const handleBulkApplyPayment = async () => {
    if (!selectedBulkDeliveryPerson) {
      toast.error("Please select a delivery person");
      return;
    }

    try {
      if (bulkPaymentMethods.length === 0) {
        toast.error("Please add at least one payment method");
        return;
      }

      const ordersForDelivery = getOrdersForDeliveryPerson(
        selectedBulkDeliveryPerson
      );
      if (ordersForDelivery.length === 0) {
        toast.error("No orders found for this delivery person");
        return;
      }

      const sortedOrders = [...ordersForDelivery].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });

      const totalBulkPayment = bulkPaymentMethods.reduce(
        (sum, method) => sum + method.amount,
        0
      );

      let successCount = 0;
      let remainingBulkPayment = totalBulkPayment;

      for (const order of sortedOrders) {
        if (remainingBulkPayment <= 0) break; 

        const { orderTotal } = calculateOrderTotal(order.items || []);
        const paymentStatus = calculatePaymentStatus(
          order.paymentType || "",
          orderTotal
        );

        if (paymentStatus.remainingAmount <= 0) continue;

        const paymentToApply = Math.min(
          paymentStatus.remainingAmount,
          remainingBulkPayment
        );

        const orderPayments = bulkPaymentMethods
          .map((method) => ({
            type: method.type,
            amount:
              Math.round(
                (method.amount / totalBulkPayment) * paymentToApply * 100
              ) / 100,
          }))
          .filter((payment) => payment.amount > 0);

        const existingPayments = parseExistingPayments(order.paymentType || "");
        const allPayments = [...existingPayments, ...orderPayments];

        const combinedPayments = allPayments.reduce(
          (acc, payment) => {
            const existing = acc.find((p) => p.type === payment.type);
            if (existing) {
              existing.amount += payment.amount;
            } else {
              acc.push({ ...payment });
            }
            return acc;
          },
          [] as Array<{ type: string; amount: number }>
        );

        const newPaymentTypeString = combinedPayments
          .map((method) => `${method.type}:${method.amount}`)
          .join(", ");

        const newTotalPaid = combinedPayments.reduce(
          (sum, method) => sum + method.amount,
          0
        );

        const updateData = {
          paymentType: newPaymentTypeString,
          isPaid: newTotalPaid >= orderTotal,
        };

        const success = await updateOrder(token, order.id, updateData);
        if (success) {
          successCount++;
          remainingBulkPayment -= paymentToApply;
        }
      }

      if (successCount === ordersForDelivery.length) {
        const totalPaymentString = bulkPaymentMethods
          .map((method) => `${method.type}:${method.amount}`)
          .join(", ");
        toast.success(
          `Bulk payment processed successfully for ${successCount} orders: ${totalPaymentString}`
        );
        handleClose();
        refreshOrdersCallback();
      } else {
        toast.error(
          `Payment processed for ${successCount} out of ${ordersForDelivery.length} orders`
        );
      }
    } catch (error) {
      console.error("Error applying bulk payment:", error);
      toast.error(
        "An error occurred while processing the bulk payment. Please try again."
      );
    }
  };

  const handleClose = () => {
    setSelectedBulkDeliveryPerson("");
    setBulkPaymentMethods([]);
    setBulkCurrentAmount("");
    setBulkPaymentMethod("cash");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ThunderIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Bulk Payment Processing
              </h2>
              <p className="text-sm text-gray-600">
                Process payments for multiple delivered orders by delivery
                person
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <svg
              className="w-5 h-5"
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

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Delivery Person Selection */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <PersonIcon className="w-4 h-4 mr-2 text-purple-600" />
              Select Delivery Person
            </label>
            <CustomSelect
              options={[
                { value: "", label: "Choose a delivery person..." },
                ...deliveryPersons.map((person) => ({
                  value: person.id,
                  label: person.name,
                })),
              ]}
              value={selectedBulkDeliveryPerson}
              onChange={setSelectedBulkDeliveryPerson}
              placeholder="Choose a delivery person..."
              className="w-full"
            />
          </div>

          {/* Orders Summary */}
          {selectedBulkDeliveryPerson && (
            <div className="bg-gradient-to-r from-gray-50 to-purple-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <svg
                    className="w-4 h-4 text-purple-600"
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
                <h3 className="font-semibold text-gray-900 text-lg">
                  Orders Summary
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">
                    Delivery Person
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {
                      deliveryPersons.find(
                        (p) => p.id === selectedBulkDeliveryPerson
                      )?.name
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">
                    Orders Count
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {
                      getOrdersForDeliveryPerson(selectedBulkDeliveryPerson)
                        .length
                    }{" "}
                    orders
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">
                    Total Amount Due
                  </span>
                  <span className="text-lg font-bold text-purple-600">
                    €
                    {getBulkPaymentTotal(selectedBulkDeliveryPerson).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {selectedBulkDeliveryPerson && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <svg
                    className="w-4 h-4 mr-2 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Payment Methods
                </label>
                <div className="text-sm text-gray-500">
                  Total: €
                  {bulkPaymentMethods
                    .reduce((sum, method) => sum + method.amount, 0)
                    .toFixed(2)}{" "}
                  / €
                  {getBulkPaymentTotal(selectedBulkDeliveryPerson).toFixed(2)}
                </div>
              </div>

              {/* Add Payment Method */}
              <div className="flex gap-3">
                <CustomInput
                  label=""
                  name="bulkCurrentAmount"
                  type="number"
                  value={bulkCurrentAmount}
                  onChange={(e) => setBulkCurrentAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  preLabel="€"
                  otherClasses="flex-1"
                  inputClasses="pl-8 focus:ring-purple-500 focus:border-purple-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkPaymentMethod("cash")}
                    className={`px-3 py-2 border-2 rounded-lg text-center transition-all duration-200 ${
                      bulkPaymentMethod === "cash"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkPaymentMethod("card")}
                    className={`px-3 py-2 border-2 rounded-lg text-center transition-all duration-200 ${
                      bulkPaymentMethod === "card"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    Card
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleBulkAddPayment}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Payment Methods List */}
              {bulkPaymentMethods.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    All Payments:
                  </h4>
                  {bulkPaymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            method.type === "cash"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {method.type.toUpperCase()}
                        </span>
                        <span className="font-medium">
                          €{method.amount.toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBulkRemovePayment(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="text-sm text-gray-500">
            {!selectedBulkDeliveryPerson ? (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Please select a delivery person
              </span>
            ) : bulkPaymentMethods.length === 0 ? (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Please add at least one payment method
              </span>
            ) : (
              <span className="flex items-center text-green-600">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Ready to process bulk payment
              </span>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkApplyPayment}
              disabled={
                !selectedBulkDeliveryPerson || bulkPaymentMethods.length === 0
              }
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <ThunderIcon className="w-4 h-4" />
              <span>Process Bulk Payment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkPaymentModal;
