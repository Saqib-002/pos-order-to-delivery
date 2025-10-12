import React, { useState } from "react";
import { Order } from "@/types/order";
import { calculateOrderTotal } from "../../../utils/orderCalculations";
import { calculatePaymentStatus } from "../../../utils/paymentStatus";
import { updateOrder } from "../../../utils/order";
import { toast } from "react-toastify";
import CustomInput from "../../shared/CustomInput";
import PersonIcon from "../../../assets/icons/person.svg?react";
import ThunderIcon from "../../../assets/icons/thunder.svg?react";

interface IndividualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  token: string;
  refreshOrdersCallback: () => void;
}

const IndividualPaymentModal: React.FC<IndividualPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  token,
  refreshOrdersCallback,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{ type: string; amount: number }>
  >([]);
  const [currentAmount, setCurrentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");

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

  const handleAddPayment = () => {
    const amount = parseFloat(currentAmount);
    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!order) {
      toast.error("No order selected");
      return;
    }

    const { orderTotal } = calculateOrderTotal(order.items || []);
    const totalPaid = paymentMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );

    if (totalPaid + amount > orderTotal) {
      toast.error("Total payment cannot exceed order total");
      return;
    }

    const existingMethodIndex = paymentMethods.findIndex(
      (method) => method.type === paymentMethod
    );

    if (existingMethodIndex !== -1) {
      const updatedMethods = [...paymentMethods];
      updatedMethods[existingMethodIndex].amount += amount;
      setPaymentMethods(updatedMethods);
    } else {
      setPaymentMethods([
        ...paymentMethods,
        { type: paymentMethod, amount: amount },
      ]);
    }

    setCurrentAmount("");
  };

  const handleRemovePayment = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const handleApplyPayment = async () => {
    if (!order) {
      toast.error("No order selected");
      return;
    }

    try {
      if (paymentMethods.length === 0) {
        toast.error("Please add at least one payment method");
        return;
      }

      const { orderTotal } = calculateOrderTotal(order.items || []);

      // Calculate new payment string by combining existing and new payments
      const existingPayments = parseExistingPayments(order.paymentType || "");
      const allPayments = [...existingPayments, ...paymentMethods];

      // Combine same payment types
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

      const paymentTypeString = combinedPayments
        .map((method) => `${method.type}:${method.amount}`)
        .join(", ");

      const totalPaid = combinedPayments.reduce(
        (sum, method) => sum + method.amount,
        0
      );

      const updateData = {
        paymentType: paymentTypeString,
        isPaid: totalPaid >= orderTotal,
      };

      const success = await updateOrder(token, order.id, updateData);
      if (success) {
        if (totalPaid >= orderTotal) {
          toast.success(`Payment completed successfully: ${paymentTypeString}`);
        } else {
          toast.success(
            `Partial payment recorded: ${paymentTypeString}. Remaining: €${(orderTotal - totalPaid).toFixed(2)}`
          );
        }
        handleClose();
        refreshOrdersCallback();
      } else {
        toast.error("Failed to update payment. Please try again.");
      }
    } catch (error) {
      console.error("Error applying payment:", error);
      toast.error(
        "An error occurred while processing the payment. Please try again."
      );
    }
  };

  const handleClose = () => {
    setPaymentMethods([]);
    setCurrentAmount("");
    setPaymentMethod("cash");
    onClose();
  };

  // Initialize payment methods when modal opens
  React.useEffect(() => {
    if (isOpen && order) {
      const existingPayments = parseExistingPayments(order.paymentType || "");
      setPaymentMethods(existingPayments);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ThunderIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Process Payment
              </h2>
              <p className="text-sm text-gray-600">
                Complete the payment for this order
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
          {/* Order Info */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <svg
                  className="w-4 h-4 text-blue-600"
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
                Order Details
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-600">
                  Order ID
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  #{order.orderId}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-600">
                  Customer
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {order.customer.name}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600">
                  Total Amount
                </span>
                <span className="text-lg font-bold text-green-600">
                  €
                  {calculateOrderTotal(order.items || []).orderTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Person Display */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <PersonIcon className="w-4 h-4 mr-2 text-blue-600" />
              Delivery Person
            </label>
            <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
              {order.deliveryPerson ? (
                <div>
                  <div className="font-medium">{order.deliveryPerson.name}</div>
                  <div className="text-sm text-gray-500">
                    {order.deliveryPerson.phone} •{" "}
                    {order.deliveryPerson.vehicleType}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">
                  No delivery person assigned
                </span>
              )}
            </div>
          </div>

          {/* Payment Methods */}
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
                {paymentMethods
                  .reduce((sum, method) => sum + method.amount, 0)
                  .toFixed(2)}{" "}
                / €
                {calculateOrderTotal(order.items || []).orderTotal.toFixed(2)}
              </div>
            </div>

            {/* Add Payment Method */}
            <div className="flex gap-3">
              <CustomInput
                label=""
                name="currentAmount"
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                preLabel="€"
                otherClasses="flex-1"
                inputClasses="pl-8 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`px-3 py-2 border-2 rounded-lg text-center transition-all duration-200 ${
                    paymentMethod === "cash"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`px-3 py-2 border-2 rounded-lg text-center transition-all duration-200 ${
                    paymentMethod === "card"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  Card
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddPayment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>

            {/* Payment Methods List */}
            {paymentMethods.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">
                  All Payments:
                </h4>
                {paymentMethods.map((method, index) => (
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
                      onClick={() => handleRemovePayment(index)}
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
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="text-sm text-gray-500">
            {paymentMethods.length === 0 ? (
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
                Ready to process payment
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
              onClick={handleApplyPayment}
              disabled={paymentMethods.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <ThunderIcon className="w-4 h-4" />
              <span>Process Payment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualPaymentModal;
