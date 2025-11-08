import React, { useState } from "react";
import { Order } from "@/types/order";
import { useTranslation } from "react-i18next";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { CrossIcon } from "../../../public/Svg";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cancelNote: string) => void;
  order: Order | null;
  orderPrefix?: string;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  order,
  orderPrefix = "K",
}) => {
  const { t } = useTranslation();
  const [cancelNote, setCancelNote] = useState("");

  if (!isOpen || !order) return null;

  const handleConfirm = () => {
    onConfirm(cancelNote);
    setCancelNote("");
  };

  const handleClose = () => {
    setCancelNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 px-6 py-4 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {t("cancelOrderModal.title") || "Cancel Order"}
            </h3>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <CrossIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              {t("cancelOrderModal.orderNumber") || "Order Number"}:
            </p>
            <p className="text-lg font-semibold text-black">
              {orderPrefix}
              {order.orderId}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              {t("cancelOrderModal.customer") || "Customer"}:
            </p>
            <p className="text-base text-black">{order.customer.name}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("cancelOrderModal.cancelNote") || "Cancellation Note *"}
            </label>
            <textarea
              name="cancelNote"
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              placeholder={
                t("cancelOrderModal.cancelNotePlaceholder") ||
                "Enter reason for cancellation..."
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none min-h-[100px] resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("cancelOrderModal.noteRequired") ||
                "A cancellation note is required"}
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={handleClose}
              label={t("cancelOrderModal.cancel") || "Cancel"}
              className="hover:scale-105"
            />
            <CustomButton
              type="button"
              variant="primary"
              onClick={handleConfirm}
              label={t("cancelOrderModal.confirm") || "Confirm Cancellation"}
              disabled={!cancelNote.trim()}
              className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-gray-900 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
