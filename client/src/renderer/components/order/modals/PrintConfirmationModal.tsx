import React from "react";
import { useTranslation } from "react-i18next";
import {
    CrossIcon,
    PrinterIcon,
} from "@/renderer/public/Svg";
import CustomButton from "../../ui/CustomButton";

interface PrintConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (shouldPrint: boolean) => void;
}

const PrintConfirmationModal: React.FC<PrintConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-linear-to-r from-gray-800 to-gray-900 text-white p-6 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <PrinterIcon className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                {t("printConfirmationModal.title")}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors touch-manipulation cursor-pointer"
                    >
                        <CrossIcon className="size-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PrinterIcon className="size-10 text-gray-600" />
                    </div>
                    <p className="text-gray-700 text-lg mb-8">
                        {t("printConfirmationModal.message")}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <CustomButton
                            type="button"
                            onClick={() => onConfirm(false)}
                            variant="secondary"
                            label={t("printConfirmationModal.noPrint")}
                            className="py-3 px-4 text-lg border-2"
                        />
                        <CustomButton
                            type="button"
                            onClick={() => onConfirm(true)}
                            label={t("printConfirmationModal.yesPrint")}
                            className="py-3 px-4 text-lg bg-gray-900 hover:bg-black text-white"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium touch-manipulation cursor-pointer"
                    >
                        {t("common.cancel")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintConfirmationModal;
