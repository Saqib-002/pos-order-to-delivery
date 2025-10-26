import { CrossIcon, OutlineCreditCardIcon } from "@/renderer/public/Svg";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { useTranslation } from "react-i18next";

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
  customerGiven?: number;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  existingPaymentType = "",
}) => {
  const { t } = useTranslation();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<"cash" | "card">("cash");

  const remainingAmount =
    totalAmount -
    paymentMethods.reduce((sum, method) => sum + method.amount, 0);

  const totalPaid = paymentMethods.reduce(
    (sum, method) => sum + method.amount,
    0
  );
  const totalCustomerGiven = paymentMethods.reduce(
    (sum, method) => sum + (method.customerGiven || 0),
    0
  );
  const changeAmount = Math.max(0, totalCustomerGiven - totalAmount);

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
      toast.error(t("paymentProcessingModal.errors.pleaseEnterValidAmount"));
      return;
    }

    const actualAmount = Math.min(currentAmount, remainingAmount);

    const existingMethodIndex = paymentMethods.findIndex(
      (method) => method.type === selectedType
    );

    if (existingMethodIndex !== -1) {
      const updatedMethods = [...paymentMethods];
      updatedMethods[existingMethodIndex].amount += actualAmount;
      updatedMethods[existingMethodIndex].customerGiven =
        (updatedMethods[existingMethodIndex].customerGiven || 0) +
        currentAmount;
      setPaymentMethods(updatedMethods);
    } else {
      setPaymentMethods([
        ...paymentMethods,
        {
          type: selectedType,
          amount: actualAmount,
          customerGiven: currentAmount,
        },
      ]);
    }

    setCurrentAmount(0);
  };

  const handleRemovePayment = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const handleProcessPayment = () => {
    if (paymentMethods.length === 0) {
      toast.error(t("paymentProcessingModal.errors.pleaseAddPaymentMethod"));
      return;
    }

    const paymentTypeString = paymentMethods
      .map((method) => `${method.type}:${method.amount}`)
      .join(", ");

    if (remainingAmount > 0.01) {
      toast.success(
        t("paymentProcessingModal.messages.partialPaymentProcessed", {
          paymentString: paymentTypeString,
          remaining: remainingAmount.toFixed(2),
        })
      );
    } else if (changeAmount > 0) {
      toast.success(
        t("paymentProcessingModal.messages.paymentProcessedWithChange", {
          paymentString: paymentTypeString,
          change: changeAmount.toFixed(2),
        })
      );
    } else {
      toast.success(
        t("paymentProcessingModal.messages.paymentProcessed", {
          paymentString: paymentTypeString,
        })
      );
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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <OutlineCreditCardIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {t("paymentProcessingModal.title")}
              </h2>
              <p className="text-indigo-100 text-sm">
                {t("paymentProcessingModal.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors touch-manipulation cursor-pointer"
          >
            <CrossIcon className="size-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Total Amount */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">
                {t("paymentProcessingModal.totalAmount")}:
              </span>
              <span className="text-2xl font-bold text-indigo-600">
                €{totalAmount.toFixed(2)}
              </span>
            </div>
            {paymentMethods.length > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">
                  {t("paymentProcessingModal.alreadyPaid")}:
                </span>
                <span className="text-lg font-semibold text-green-600">
                  €{totalPaid.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">
                {t("paymentProcessingModal.remaining")}:
              </span>
              <span
                className={`text-lg font-semibold ${remainingAmount > 0.01 ? "text-red-600" : "text-green-600"}`}
              >
                €{remainingAmount.toFixed(2)}
              </span>
            </div>
            {totalCustomerGiven > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-normal text-gray-600">
                  {t("paymentProcessingModal.amountTendered")}:
                </span>
                <span className="text-lg font-bold text-blue-700">
                  €{totalCustomerGiven.toFixed(2)}
                </span>
              </div>
            )}
            {changeAmount > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-normal text-gray-600">
                  {t("paymentProcessingModal.changeToReturn")}:
                </span>
                <span className="text-lg font-bold text-red-600">
                  €{changeAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">
              {t("paymentProcessingModal.paymentMethod")}
            </h3>
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
                  <span className="font-medium text-lg">
                    {t("paymentProcessingModal.cash")}
                  </span>
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
                  <span className="font-medium text-lg">
                    {t("paymentProcessingModal.card")}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <CustomInput
              label={t("paymentProcessingModal.amount")}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPayment();
                }
              }}
              value={currentAmount || ""}
              onChange={(e) =>
                setCurrentAmount(parseFloat(e.target.value) || 0)
              }
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              name="price"
              inputClasses="py-3 px-4 text-xl text-center font-semibold focus:!ring-1"
            />
            <CustomButton
              onClick={handleAddPayment}
              type="button"
              label={t("paymentProcessingModal.addPayment")}
              className="w-full py-3 px-4 text-lg"
            />
          </div>

          {/* Payment Methods List */}
          {paymentMethods.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                {t("paymentProcessingModal.addedPayments")}
              </h3>
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
                          {method.type === "cash"
                            ? t("paymentProcessingModal.cash")
                            : t("paymentProcessingModal.card")}
                        </div>
                        <div className="text-sm text-gray-600">
                          €{method.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePayment(index)}
                      className="cursor-pointer p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                    >
                      <CrossIcon className="size-5" />
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
            <CustomButton
              onClick={onClose}
              type="button"
              label={t("common.cancel")}
              className="w-full py-3 px-4 text-lg"
              variant="secondary"
            />
            <CustomButton
              onClick={handleProcessPayment}
              type="button"
              label={t("paymentProcessingModal.processPayment")}
              className="w-full py-3 px-4 text-lg"
              disabled={paymentMethods.length === 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingModal;
