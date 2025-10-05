import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: {
    paymentType: string;
    totalAmount: number;
  }) => void;
  totalAmount: number;
  existingPaymentType?: string;
}

interface PaymentMethod {
  type: "cash" | "card";
  amount: number;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  existingPaymentType = "",
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<"cash" | "card">("cash");

  const remainingAmount =
    totalAmount -
    paymentMethods.reduce((sum, method) => sum + method.amount, 0);

  useEffect(() => {
    if (isOpen && existingPaymentType && existingPaymentType !== "pending") {
      try {
        const existingPayments: PaymentMethod[] = existingPaymentType
          .split(", ")
          .map((payment) => {
            const [type, amount] = payment.split(":");
            return {
              type: type.trim() as "cash" | "card",
              amount: parseFloat(amount) || 0,
            };
          })
          .filter((payment) => payment.amount > 0);

        setPaymentMethods(existingPayments);
      } catch (error) {
        console.error("Error parsing existing payments:", error);
        setPaymentMethods([]);
      }
    } else if (isOpen) {
      setPaymentMethods([]);
    }
  }, [isOpen, existingPaymentType]);

  const handleAddPayment = () => {
    if (currentAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (currentAmount > remainingAmount) {
      toast.error("Amount cannot exceed remaining balance");
      return;
    }

    const existingMethodIndex = paymentMethods.findIndex(
      (method) => method.type === selectedType
    );

    if (existingMethodIndex !== -1) {
      const updatedMethods = [...paymentMethods];
      updatedMethods[existingMethodIndex].amount += currentAmount;
      setPaymentMethods(updatedMethods);
    } else {
      setPaymentMethods([
        ...paymentMethods,
        { type: selectedType, amount: currentAmount },
      ]);
    }

    setCurrentAmount(0);
  };

  const handleRemovePayment = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const handleProcessPayment = () => {
    if (paymentMethods.length === 0) {
      toast.error("Please add at least one payment method");
      return;
    }

    const paymentTypeString = paymentMethods
      .map((method) => `${method.type}:${method.amount}`)
      .join(", ");

    const totalPaid = paymentMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );

    if (remainingAmount > 0.01) {
      toast.success(
        `Partial payment processed: ${paymentTypeString} (Remaining: €${remainingAmount.toFixed(2)})`
      );
    } else {
      toast.success(`Payment processed: ${paymentTypeString}`);
    }

    onConfirm({
      paymentType: paymentTypeString,
      totalAmount: totalAmount,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Payment Processing</h2>
                <p className="text-indigo-100 text-sm">
                  Select payment methods
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
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

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Total Amount */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">
                Total Amount:
              </span>
              <span className="text-2xl font-bold text-indigo-600">
                €{totalAmount.toFixed(2)}
              </span>
            </div>
            {paymentMethods.length > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Already Paid:</span>
                <span className="text-lg font-semibold text-green-600">
                  €
                  {paymentMethods
                    .reduce((sum, method) => sum + method.amount, 0)
                    .toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Remaining:</span>
              <span
                className={`text-lg font-semibold ${remainingAmount > 0.01 ? "text-red-600" : "text-green-600"}`}
              >
                €{remainingAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Payment Method</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedType("cash")}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors touch-manipulation ${
                  selectedType === "cash"
                    ? "border-green-400 bg-green-50 text-green-800"
                    : "border-gray-200 hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">💵</span>
                  <span className="font-medium text-lg">Cash</span>
                </div>
              </button>
              <button
                onClick={() => setSelectedType("card")}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors touch-manipulation ${
                  selectedType === "card"
                    ? "border-blue-400 bg-blue-50 text-blue-800"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">💳</span>
                  <span className="font-medium text-lg">Card</span>
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Amount</h3>
            <div className="space-y-3">
              <input
                type="number"
                step="0.01"
                min="0"
                max={totalAmount}
                value={currentAmount || ""}
                onChange={(e) =>
                  setCurrentAmount(parseFloat(e.target.value) || 0)
                }
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-xl text-center font-semibold"
                placeholder="0.00"
              />
              <button
                onClick={handleAddPayment}
                className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors touch-manipulation font-medium text-lg"
              >
                Add Payment
              </button>
            </div>
          </div>

          {/* Payment Methods List */}
          {paymentMethods.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Added Payments</h3>
              <div className="space-y-2">
                {paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {method.type === "cash" ? "💵" : "💳"}
                      </span>
                      <div>
                        <div className="font-medium text-gray-800 capitalize text-lg">
                          {method.type}
                        </div>
                        <div className="text-sm text-gray-600">
                          €{method.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePayment(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
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
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={paymentMethods.length === 0}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-manipulation font-medium"
            >
              Process Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingModal;
