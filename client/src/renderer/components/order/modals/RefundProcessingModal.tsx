import { CrossIcon, OutlineCreditCardIcon } from "@/renderer/public/Svg";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import CustomButton from "../../ui/CustomButton";
import { useTranslation } from "react-i18next";

interface RefundProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (refundData: {
    refundAmount: number;
    remainingAmount: number;
    paymentType: string;
  }) => void;
  existingPaymentType: string;
  totalAmount: number;
}

interface RefundPaymentMethod {
  type: "cash" | "card";
  amount: number;
  selected: boolean;
}

const RefundProcessingModal: React.FC<RefundProcessingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  existingPaymentType,
  totalAmount,
}) => {
  const { t } = useTranslation();
  const [refundMethods, setRefundMethods] = useState<RefundPaymentMethod[]>([]);

  useEffect(() => {
    if (
      isOpen &&
      existingPaymentType &&
      existingPaymentType !== "pending" &&
      existingPaymentType !== "refunded"
    ) {
      try {
        const existingPayments: RefundPaymentMethod[] = existingPaymentType
          .split(", ")
          .map((payment) => {
            const [type, amount] = payment.split(":");
            return {
              type: type.trim() as "cash" | "card",
              amount: parseFloat(amount) || 0,
              selected: false,
            };
          })
          .filter((payment) => payment.amount > 0);

        setRefundMethods(existingPayments);
      } catch (error) {
        console.error("Error parsing existing payments:", error);
        setRefundMethods([]);
      }
    } else if (isOpen) {
      setRefundMethods([]);
    }
  }, [isOpen, existingPaymentType]);

  const totalPaid = refundMethods.reduce(
    (sum, method) => sum + method.amount,
    0
  );
  const totalRefundAmount = refundMethods
    .filter((method) => method.selected)
    .reduce((sum, method) => sum + method.amount, 0);
  const refundableAmount = totalPaid - totalRefundAmount;

  const handleRefundMethodToggle = (index: number) => {
    const updatedMethods = [...refundMethods];
    updatedMethods[index].selected = !updatedMethods[index].selected;
    setRefundMethods(updatedMethods);
  };

  const handleProcessRefund = () => {
    const selectedMethods = refundMethods.filter((method) => method.selected);

    if (selectedMethods.length === 0) {
      toast.error(
        t("refundProcessingModal.errors.pleaseSelectPaymentToRefund")
      );
      return;
    }

    const refundAmount = totalRefundAmount;

    // Create new payment type string with only non-selected payments
    const remainingPayments = refundMethods
      .filter((method) => !method.selected)
      .map((method) => `${method.type}:${method.amount}`)
      .join(", ");

    const newPaymentType = remainingPayments || "refunded";

    toast.success(
      t("refundProcessingModal.messages.refundProcessed", {
        refundAmount: totalRefundAmount.toFixed(2),
      })
    );

    onConfirm({
      refundAmount: totalRefundAmount,
      remainingAmount: totalAmount - refundableAmount,
      paymentType: newPaymentType,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-6 rounded-t-2xl flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <OutlineCreditCardIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {t("refundProcessingModal.title")}
              </h2>
              <p className="text-gray-200 text-sm">
                {t("refundProcessingModal.subtitle")}
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
          {/* Amount Summary */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-red-800">
                {t("refundProcessingModal.originalAmount")}:
              </span>
              <span className="text-lg font-bold text-red-600">
                €{totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-red-800">
                {t("refundProcessingModal.totalPaid")}:
              </span>
              <span className="text-lg font-semibold text-red-600">
                €{totalPaid.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-red-800">
                {t("refundProcessingModal.refundableAmount")}:
              </span>
              <span className="text-lg font-semibold text-red-600">
                €{refundableAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Methods to Refund */}
          {refundMethods.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">
                {t("refundProcessingModal.selectPaymentsToRefund")}
              </h3>
              <div className="space-y-3">
                {refundMethods.map((method, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      method.selected
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 hover:border-red-300"
                    }`}
                    onClick={() => handleRefundMethodToggle(index)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={method.selected}
                        onChange={() => handleRefundMethodToggle(index)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <img
                        src={
                          method.type === "cash"
                            ? "./images/cash.png"
                            : "./images/card.png"
                        }
                        alt={method.type}
                        className="w-8 h-8"
                      />
                      <div>
                        <div className="font-medium text-gray-800 capitalize text-lg">
                          {method.type === "cash"
                            ? t("refundProcessingModal.cash")
                            : t("refundProcessingModal.card")}
                        </div>
                        <div className="text-sm text-gray-600">
                          €{method.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {refundMethods.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-1">
                {t("refundProcessingModal.noPayments")}
              </h3>
              <p className="text-gray-500 text-sm">
                {t("refundProcessingModal.noPaymentsDescription")}
              </p>
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
              onClick={handleProcessRefund}
              type="button"
              label={t("refundProcessingModal.processRefund")}
              className="w-full py-3 px-4 text-lg bg-red-600 hover:bg-red-700"
              disabled={refundMethods.filter((m) => m.selected).length === 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundProcessingModal;
