import { useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, CrossIcon, ExclamationIcon, InfoIcon } from "../assets/Svg";
import CustomButton from "../components/ui/CustomButton";
import { ConfirmOptions } from "@/types/confirm";
import { ConfirmContext } from "../hooks/useConfirm";


export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolver, setResolver] = useState<(value: boolean) => void>();

    const confirm = (options: ConfirmOptions) => {
        setOptions(options);
        return new Promise<boolean>((resolve) => setResolver(() => resolve));
    };

    const handleClose = (value: boolean) => {
        setOptions(null);
        resolver?.(value);
    };

    const styles = getTypeStyles(options?.type || "danger");

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {options &&
                createPortal(
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={(e) => e.target === e.currentTarget && handleClose(false)}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
                            {/* Header */}
                            <div className={`relative bg-gradient-to-r ${styles.headerBg} text-white p-6`}>
                                <div className="flex items-center space-x-3">
                                    <div
                                        className={`w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center`}
                                    >
                                        <div className={styles.iconColor}>{options.icon || styles.icon}</div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">
                                            {options.title || "Confirm Action"}
                                        </h2>
                                        <p className="text-white/80 text-sm">Please confirm your action</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleClose(false)}
                                    className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer"
                                >
                                    <CrossIcon className="size-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <div className="text-center space-y-4">
                                    <p className="text-gray-700 leading-relaxed">{options.message}</p>
                                    {options.itemName && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium"></span> {options.itemName}
                                            </p>
                                        </div>
                                    )}
                                    {options.type === "danger" && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-start space-x-3">
                                                <ExclamationIcon className="size-5 text-red-600 mt-1" />
                                                <div>
                                                    <p className="text-sm font-medium text-red-800">
                                                        This action cannot be undone
                                                    </p>
                                                    <p className="text-sm text-red-700 mt-1">
                                                        {options.specialNote?options.specialNote:"Once deleted, this item will be permanently removed from the system."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-gray-50 border-t border-gray-200 flex space-x-3">
                                <CustomButton type="button" onClick={() => handleClose(false)} className="flex-1 text-lg py-4" label={options.cancelText || "Cancel"} variant="secondary" />
                                <CustomButton type="button" onClick={() => handleClose(true)} label={options.confirmText || "Confirm"} className={`flex-1 bg-gradient-to-r ${styles.confirmBg} ${styles.confirmHover} border-none text-lg py-4`} Icon={<div className={`${styles.iconBg} rounded-full border-none p-1`}>
                                    <CheckIcon className={`size-4 ${styles.iconColor}`} />
                                </div>} />
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </ConfirmContext.Provider>
    );
};

function getTypeStyles(type: string) {
    switch (type) {
        case "danger":
            return {
                headerBg: "from-red-600 to-red-700",
                iconBg: "bg-red-100",
                iconColor: "text-red-600",
                confirmBg: "from-red-600 to-red-700",
                confirmHover: "hover:from-red-700 hover:to-red-800",
                icon: (
                    <ExclamationIcon className="size-6" />
                ),
            };
        case "success":
            return {
                headerBg: "from-green-600 to-emerald-600",
                iconBg: "bg-green-100",
                iconColor: "text-green-600",
                confirmBg: "from-green-600 to-emerald-600",
                confirmHover: "hover:from-green-700 hover:to-emerald-700",
                icon: (
                    <div className="size-6 p-1 bg-green-600 rounded-full">
                        <CheckIcon className="size-full text-white" />
                    </div>
                ),
            };
        case "info":
            return {
                headerBg: "from-blue-600 to-indigo-600",
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
                confirmBg: "from-blue-600 to-indigo-600",
                confirmHover: "hover:from-blue-700 hover:to-indigo-700",
                icon: (
                    <InfoIcon className="size-6" />
                ),
            };
        case "warning":
            return {
                headerBg: "from-yellow-600 to-orange-600",
                iconBg: "bg-yellow-100",
                iconColor: "text-yellow-600",
                confirmBg: "from-yellow-600 to-orange-600",
                confirmHover: "hover:from-yellow-700 hover:to-orange-700",
                icon: (
                    <ExclamationIcon className="size-6" />
                ),
            };
        default:
            return {
                headerBg: "from-gray-600 to-gray-700",
                iconBg: "bg-gray-100",
                iconColor: "text-gray-600",
                confirmBg: "from-gray-600 to-gray-700",
                confirmHover: "hover:from-gray-700 hover:to-gray-800",
                icon: (
                    <InfoIcon className="size-6" />
                ),
            };
    }
}
