import React from "react";
import { useTranslation } from "react-i18next";
import {
  CrossIcon,
  OutlineCreditCardIcon,
  ClockIcon,
} from "@/renderer/public/Svg";
import CustomButton from "../../ui/CustomButton";

interface PaymentOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayNow: () => void;
  onPayLater: () => void;
  totalAmount: number;
  orderType: "pickup" | "dine-in";
}

const PaymentOptionModal: React.FC<PaymentOptionModalProps> = ({
  isOpen,
  onClose,
  onPayNow,
  onPayLater,
  totalAmount,
  orderType,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <OutlineCreditCardIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {t("paymentOptionModal.title")}
              </h2>
              <p className="text-indigo-100 text-sm">
                {orderType === "pickup"
                  ? t("paymentOptionModal.pickupOrder")
                  : t("paymentOptionModal.dineInOrder")}
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-black mb-2">
              €{totalAmount.toFixed(2)}
            </div>
            <p className="text-gray-600">
              {t("paymentOptionModal.choosePaymentMethod")}
            </p>
          </div>

          {/* Payment Options */}
          <div className="space-y-4">
            {/* Pay Now Option */}
            <button
              onClick={onPayNow}
              className="w-full p-4 border-2 border-indigo-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <OutlineCreditCardIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-black">
                    {t("paymentOptionModal.payNow.title")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("paymentOptionModal.payNow.description")}
                  </p>
                </div>
                <div className="text-indigo-600">
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>

            {/* Pay Later Option */}
            <button
              onClick={onPayLater}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <ClockIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-black">
                    {t("paymentOptionModal.payLater.title")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("paymentOptionModal.payLater.description")}
                  </p>
                </div>
                <div className="text-gray-600">
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <CustomButton
            type="button"
            onClick={onClose}
            variant="secondary"
            label={t("paymentOptionModal.cancel")}
            className="w-full py-3 px-4 text-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionModal;
