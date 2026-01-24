import React, { useState } from "react";
import { Order } from "@/types/order";
import { calculateOrderTotal } from "../../../utils/orderCalculations";
import { calculatePaymentStatus } from "../../../utils/paymentStatus";
import { updateOrder } from "../../../utils/order";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import CustomInput from "../../shared/CustomInput";
import { CustomSelect } from "../../ui/CustomSelect";
import { LightningBoltIcon, PersonIcon } from "@/renderer/public/Svg";

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  deliveryPersons: Array<{ id: string; name: string }>;
  token: string;
  refreshOrdersCallback: () => void;
}

const BulkPaymentModal: React.FC<BulkPaymentModalProps> = ({
  isOpen,
  onClose,
  orders,
  deliveryPersons,
  token,
  refreshOrdersCallback,
}) => {
  const { t } = useTranslation();
  const [selectedBulkDeliveryPerson, setSelectedBulkDeliveryPerson] =
    useState("");
  const [bulkPaymentMethods, setBulkPaymentMethods] = useState<
    Array<{ type: string; amount: number; customerGiven?: number }>
  >([]);
  const [bulkCurrentAmount, setBulkCurrentAmount] = useState("");
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<"cash" | "card">(
    "cash"
  );
  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  React.useEffect(() => {
    const fetchPendingOrders = async () => {
      if (!selectedBulkDeliveryPerson || !isOpen) {
        setFetchedOrders([]);
        return;
      }

      setLoadingOrders(true);
      try {
        const res = await (window as any).electronAPI.getPendingOrdersByDeliveryPerson(
          token,
          selectedBulkDeliveryPerson
        );
        if (res.status) {
          setFetchedOrders(res.data || []);
        } else {
          toast.error(t("bulkPaymentModal.errors.fetchFailed") || "Failed to fetch pending orders");
        }
      } catch (error) {
        console.error("Error fetching pending orders:", error);
        toast.error(t("bulkPaymentModal.errors.fetchFailed") || "Failed to fetch pending orders");
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchPendingOrders();
  }, [selectedBulkDeliveryPerson, isOpen, token]);

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

      return payments.filter(
        (payment) => payment.type.toLowerCase() !== "pending"
      );
    } catch (error) {
      console.error(
        "Error parsing existing payment string:",
        paymentTypeString,
        error
      );
      return [];
    }
  };

  // Get orders for bulk payment processing
  const getOrdersForDeliveryPerson = (deliveryPersonId: string) => {
    return fetchedOrders;
  };

  const getBulkPaymentTotal = (deliveryPersonId: string) => {
    const ordersForDelivery = getOrdersForDeliveryPerson(deliveryPersonId);
    return ordersForDelivery.reduce((total, order) => {
      const { orderTotal } = calculateOrderTotal(order.items || []);
      const paymentStatus = calculatePaymentStatus(
        order.paymentType || "",
        orderTotal
      );
      return total + paymentStatus.remainingAmount;
    }, 0);
  };

  const handleBulkAddPayment = () => {
    const amount = parseFloat(bulkCurrentAmount);
    if (amount <= 0) {
      toast.error(t("individualPaymentModal.errors.enterValidAmount"));
      return;
    }

    if (!selectedBulkDeliveryPerson) {
      toast.error(t("individualPaymentModal.errors.selectDeliveryPerson"));
      return;
    }

    const totalAmount = getBulkPaymentTotal(selectedBulkDeliveryPerson);
    const totalPaid = bulkPaymentMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );
    const actualAmount = Math.min(amount, totalAmount - totalPaid);

    if (actualAmount <= 0) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.noRemainingAmount") ||
        "No remaining amount to pay. The total has already been paid."
      );
      return;
    }

    const existingMethodIndex = bulkPaymentMethods.findIndex(
      (method) => method.type === bulkPaymentMethod
    );

    if (existingMethodIndex !== -1) {
      const updatedMethods = [...bulkPaymentMethods];
      updatedMethods[existingMethodIndex].amount += actualAmount;
      updatedMethods[existingMethodIndex].customerGiven =
        (updatedMethods[existingMethodIndex].customerGiven || 0) + amount;
      setBulkPaymentMethods(updatedMethods);
    } else {
      setBulkPaymentMethods([
        ...bulkPaymentMethods,
        {
          type: bulkPaymentMethod,
          amount: actualAmount,
          customerGiven: amount,
        },
      ]);
    }
    setBulkCurrentAmount("");
  };

  const handleBulkRemovePayment = (index: number) => {
    setBulkPaymentMethods(bulkPaymentMethods.filter((_, i) => i !== index));
  };

  const handleBulkApplyPayment = async () => {
    if (!selectedBulkDeliveryPerson) {
      toast.error(t("bulkPaymentModal.pleaseSelectDeliveryPerson"));
      return;
    }

    try {
      if (bulkPaymentMethods.length === 0) {
        toast.error(t("individualPaymentModal.errors.addPaymentMethod"));
        return;
      }

      const ordersForDelivery = getOrdersForDeliveryPerson(
        selectedBulkDeliveryPerson
      );
      if (ordersForDelivery.length === 0) {
        toast.error(t("individualPaymentModal.errors.noOrdersFound"));
        return;
      }

      const sortedOrders = [...ordersForDelivery].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });

      const totalBulkPayment = bulkPaymentMethods.reduce(
        (sum, method) => sum + method.amount,
        0
      );

      let successCount = 0;
      let remainingBulkPayment = totalBulkPayment;

      for (const order of sortedOrders) {
        if (remainingBulkPayment <= 0) break;

        const { orderTotal } = calculateOrderTotal(order.items || []);
        const paymentStatus = calculatePaymentStatus(
          order.paymentType || "",
          orderTotal
        );

        if (paymentStatus.remainingAmount <= 0) continue;

        const paymentToApply = Math.min(
          paymentStatus.remainingAmount,
          remainingBulkPayment
        );

        const orderPayments = bulkPaymentMethods
          .map((method) => ({
            type: method.type,
            amount:
              Math.round(
                (method.amount / totalBulkPayment) * paymentToApply * 100
              ) / 100,
          }))
          .filter((payment) => payment.amount > 0);

        const existingPayments = parseExistingPayments(order.paymentType || "");
        const allPayments = [...existingPayments, ...orderPayments];

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

        const newPaymentTypeString = combinedPayments
          .map((method) => `${method.type}:${method.amount}`)
          .join(", ");

        const newTotalPaid = combinedPayments.reduce(
          (sum, method) => sum + method.amount,
          0
        );

        const updateData = {
          paymentType: newPaymentTypeString,
          isPaid: newTotalPaid >= orderTotal,
        };

        const success = await updateOrder(token, order.id, updateData);
        if (success) {
          successCount++;
          remainingBulkPayment -= paymentToApply;
        }
      }

      if (successCount === ordersForDelivery.length) {
        const totalPaymentString = bulkPaymentMethods
          .map((method) => `${method.type}:${method.amount}`)
          .join(", ");

        const changeAmount = Math.max(0, totalCustomerGiven - totalAmount);

        if (changeAmount > 0) {
          toast.success(
            `Bulk payment completed: ${totalPaymentString} (Change: €${changeAmount.toFixed(2)})`
          );
        } else {
          toast.success(
            t("individualPaymentModal.success.bulkPaymentSuccess", {
              count: successCount,
              paymentString: totalPaymentString,
            })
          );
        }
        handleClose();
        refreshOrdersCallback();
      } else {
        toast.warning(
          t("individualPaymentModal.success.bulkPaymentPartial", {
            successCount,
            totalCount: ordersForDelivery.length,
          })
        );
        handleClose();
        refreshOrdersCallback();
      }
    } catch (error) {
      console.error("Error applying bulk payment:", error);
      toast.error(t("individualPaymentModal.errors.bulkProcessingError"));
    }
  };

  const handleClose = () => {
    setSelectedBulkDeliveryPerson("");
    setBulkPaymentMethods([]);
    setBulkCurrentAmount("");
    setBulkPaymentMethod("cash");
    onClose();
  };

  if (!isOpen) return null;

  const totalAmount = selectedBulkDeliveryPerson
    ? getBulkPaymentTotal(selectedBulkDeliveryPerson)
    : 0;
  const totalPaid = bulkPaymentMethods.reduce(
    (sum, method) => sum + method.amount,
    0
  );
  const totalCustomerGiven = bulkPaymentMethods.reduce(
    (sum, method) => sum + (method.customerGiven || 0),
    0
  );
  const remainingAmount = totalAmount - totalPaid;
  const changeAmount = Math.max(0, totalCustomerGiven - totalAmount);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-black to-gray-800 text-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-700 rounded-lg">
              <LightningBoltIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {t("bulkPaymentModal.title")}
              </h2>
              <p className="text-sm text-gray-300">
                {t("bulkPaymentModal.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
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
          {/* Delivery Person Selection */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <PersonIcon className="w-4 h-4 mr-2 text-gray-600" />
              {t("bulkPaymentModal.selectDeliveryPerson")}
            </label>
            <CustomSelect
              options={[
                {
                  value: "",
                  label: t("bulkPaymentModal.chooseDeliveryPerson"),
                },
                ...deliveryPersons.map((person) => ({
                  value: person.id,
                  label: person.name,
                })),
              ]}
              value={selectedBulkDeliveryPerson}
              onChange={setSelectedBulkDeliveryPerson}
              placeholder={t("bulkPaymentModal.chooseDeliveryPerson")}
              className="w-full"
            />
          </div>

          {/* Orders Summary */}
          {selectedBulkDeliveryPerson && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-gray-200 rounded-lg">
                  <svg
                    className="w-4 h-4 text-gray-700"
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
                  {t("bulkPaymentModal.ordersSummary")}
                </h3>
                {loadingOrders && <span className="text-sm text-blue-500 italic ml-2">({t("common.loading") || "Loading..."})</span>}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">
                    {t("bulkPaymentModal.deliveryPerson")}
                  </span>
                  <span className="text-sm font-semibold text-black">
                    {
                      deliveryPersons.find(
                        (p) => p.id === selectedBulkDeliveryPerson
                      )?.name
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">
                    {t("bulkPaymentModal.ordersCount")}
                  </span>
                  <span className="text-sm font-semibold text-black">
                    {
                      getOrdersForDeliveryPerson(selectedBulkDeliveryPerson)
                        .length
                    }{" "}
                    {t("bulkPaymentModal.orders")}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">
                    {t("bulkPaymentModal.totalAmountDue")}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    €{totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-gray-600">
                    {t("bulkPaymentModal.remainingAmount")}
                  </span>
                  <span
                    className={`text-lg font-bold ${remainingAmount > 0.01 ? "text-red-600" : "text-green-600"
                      }`}
                  >
                    €{remainingAmount.toFixed(2)}
                  </span>
                </div>

                {totalCustomerGiven > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-semibold text-gray-600">
                      {t("bulkPaymentModal.amountTendered")}:
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      €{totalCustomerGiven.toFixed(2)}
                    </span>
                  </div>
                )}

                {changeAmount > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-semibold text-gray-600">
                      {t("bulkPaymentModal.changeToReturn")}:
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      €{changeAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {selectedBulkDeliveryPerson && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-600"
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
                  {t("bulkPaymentModal.paymentMethods")}
                </label>
                <div className="text-sm text-gray-500">
                  {t("bulkPaymentModal.total", {
                    paid: totalPaid.toFixed(2),
                    total: totalAmount.toFixed(2),
                  })}
                </div>
              </div>

              {/* Add Payment Method */}
              <div className="flex gap-3">
                <CustomInput
                  label=""
                  name="bulkCurrentAmount"
                  type="number"
                  value={bulkCurrentAmount}
                  onChange={(e) => setBulkCurrentAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  preLabel="€"
                  otherClasses="flex-1"
                  inputClasses="pl-8 focus:ring-gray-500 focus:border-gray-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkPaymentMethod("cash")}
                    className={`p-1 border-2 rounded-lg transition-all duration-200 flex items-center justify-center ${bulkPaymentMethod === "cash"
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                      }`}
                  >
                    <img
                      src="./images/cash.png"
                      alt="cash"
                      className="w-8 h-8"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkPaymentMethod("card")}
                    className={`p-1 border-2 rounded-lg transition-all duration-200 flex items-center justify-center ${bulkPaymentMethod === "card"
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                      }`}
                  >
                    <img
                      src="./images/card.png"
                      alt="card"
                      className="w-8 h-8"
                    />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleBulkAddPayment}
                  className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium transition-all duration-200"
                >
                  {t("bulkPaymentModal.add")}
                </button>
              </div>

              {/* Payment Methods List */}
              {bulkPaymentMethods.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    {t("bulkPaymentModal.allPayments")}
                  </h4>
                  {bulkPaymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            method.type === "cash"
                              ? "./images/cash.png"
                              : "./images/card.png"
                          }
                          alt={method.type}
                          className="w-6 h-6"
                        />
                        <span className="font-medium text-gray-900">
                          €{method.amount.toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBulkRemovePayment(index)}
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
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="text-sm text-gray-500">
            {!selectedBulkDeliveryPerson ? (
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
                {t("bulkPaymentModal.pleaseSelectDeliveryPerson")}
              </span>
            ) : bulkPaymentMethods.length === 0 ? (
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
                {t("individualPaymentModal.pleaseAddPaymentMethod")}
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
                {t("bulkPaymentModal.readyToProcess")}
              </span>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors duration-200"
            >
              {t("bulkPaymentModal.cancel")}
            </button>
            <button
              onClick={handleBulkApplyPayment}
              disabled={
                !selectedBulkDeliveryPerson || bulkPaymentMethods.length === 0
              }
              className="px-6 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <LightningBoltIcon className="w-4 h-4" />
              <span>{t("bulkPaymentModal.processPayments")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkPaymentModal;
