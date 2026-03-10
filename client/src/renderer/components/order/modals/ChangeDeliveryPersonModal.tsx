import React, { useState } from "react";
import { Order } from "@/types/order";
import { DeliveryPerson } from "@/types/delivery";
import { updateOrder } from "../../../utils/order";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { CustomSelect } from "../../ui/CustomSelect";
import { UserCheck, X, Bike } from "lucide-react";

interface ChangeDeliveryPersonModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    deliveryPersons: DeliveryPerson[];
    token: string;
    refreshOrdersCallback: () => void;
}

const ChangeDeliveryPersonModal: React.FC<ChangeDeliveryPersonModalProps> = ({
    isOpen,
    onClose,
    order,
    deliveryPersons,
    token,
    refreshOrdersCallback,
}) => {
    const { t } = useTranslation();
    const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<DeliveryPerson | null>(null);
    const [loading, setLoading] = useState(false);

    const handleApplyChange = async () => {
        if (!order || !selectedDeliveryPerson) {
            toast.error(t("deliveryView.messages.pleaseEnterDeliveryPersonName") || "Please select a delivery person");
            return;
        }

        setLoading(true);
        try {
            const res = await updateOrder(token, order.id, {
                deliveryPersonId: selectedDeliveryPerson.id,
                deliveryPersonPhone: selectedDeliveryPerson.phone,
                deliveryPersonName: selectedDeliveryPerson.name,
                deliveryPersonEmail: selectedDeliveryPerson.email || "",
                deliveryPersonVehicleType: selectedDeliveryPerson.vehicleType,
                deliveryPersonLicenseNo: selectedDeliveryPerson.licenseNo || "",
                status: order.status,
            });

            if (res) {
                toast.success(t("deliveryView.messages.deliveryPersonChanged") || "Delivery person changed successfully");
                refreshOrdersCallback();
                onClose();
            } else {
                toast.error(t("deliveryView.messages.failedToChangeDeliveryPerson") || "Failed to change delivery person");
            }
        } catch (error) {
            console.error("Error changing delivery person:", error);
            toast.error(t("deliveryView.messages.failedToChangeDeliveryPerson") || "Failed to change delivery person");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <UserCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {t("deliveryView.changeDeliveryPerson") || "Change Delivery Person"}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {t("manageOrders.table.orderNumber")}: {order.ticketNumber || order.orderId}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {t("deliveryView.selectNewDeliveryPerson") || "Select New Delivery Person"}
                        </label>
                        <CustomSelect
                            options={deliveryPersons
                                .filter((p) => p.isActive !== false)
                                .map((p) => ({
                                    value: p.id || "",
                                    label: `${p.name} (${p.vehicleType || "N/A"})`,
                                }))}
                            value={selectedDeliveryPerson?.id || ""}
                            onChange={(value) => {
                                const person = deliveryPersons.find((p) => p.id === value);
                                if (person) setSelectedDeliveryPerson(person);
                            }}
                            placeholder={t("deliveryView.selectNewDeliveryPerson") || "Select new delivery person"}
                            className="w-full"
                        />
                    </div>

                    {order.deliveryPerson && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-3">
                            <Bike className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-amber-800 font-medium">
                                    {t("deliveryView.messages.currentlyAssignedTo") || "Currently assigned to"}:
                                </p>
                                <p className="text-sm text-amber-700">
                                    {order.deliveryPerson.name} {order.deliveryPerson.phone ? `(${order.deliveryPerson.phone})` : ""}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                    >
                        {t("common.cancel") || "Cancel"}
                    </button>
                    <button
                        onClick={handleApplyChange}
                        disabled={!selectedDeliveryPerson || loading}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm active:scale-95"
                    >
                        {loading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <UserCheck className="w-4 h-4" />
                        )}
                        <span>{t("deliveryView.confirmChange") || "Confirm Change"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangeDeliveryPersonModal;
