import React from "react";
import { useTranslation } from "react-i18next";
import { CrossIcon, ExclamationIcon } from "@/renderer/public/Svg";
import CustomButton from "../../ui/CustomButton";

interface SwipeToKitchenAlertModalProps {
  ticket: string;
  message: string;
  onOpenOrder: () => void;
  onClose: () => void;
}

// Shown when a swiped order could not be sent to the kitchen (for example the
// address is outside the delivery zones). The order stays pending.
const SwipeToKitchenAlertModal: React.FC<SwipeToKitchenAlertModalProps> = ({
  ticket,
  message,
  onOpenOrder,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden flex flex-col">
        <div className="bg-linear-to-r from-red-600 to-red-700 text-white p-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ExclamationIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {t("orderComponent.swipeToKitchen.errorTitle")}
              </h2>
              <p className="text-white/90 text-sm">{ticket}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors touch-manipulation cursor-pointer"
          >
            <CrossIcon className="size-6" />
          </button>
        </div>

        <div className="p-6 text-center">
          <p className="text-gray-800 text-lg mb-8">{message}</p>
          <div className="grid grid-cols-2 gap-4">
            <CustomButton
              type="button"
              onClick={onClose}
              variant="secondary"
              label={t("orderComponent.swipeToKitchen.close")}
              className="py-3 px-4 text-lg border-2"
            />
            <CustomButton
              type="button"
              onClick={onOpenOrder}
              label={t("orderComponent.swipeToKitchen.openOrder")}
              className="py-3 px-4 text-lg bg-gray-900 hover:bg-black text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeToKitchenAlertModal;
