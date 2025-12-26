import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import CustomInput from "./CustomInput";
import CustomButton from "../ui/CustomButton";
import { AddIcon, DeleteIcon } from "../../public/Svg";

export interface PaymentMethod {
  type: "cash" | "card" | "bizum" | "bank-transfer";
  amount: number;
  amountTendered?: number;
}

interface PaymentStepProps {
  totalAmount: number;
  paymentMethods: PaymentMethod[];
  onPaymentMethodsChange: (methods: PaymentMethod[]) => void;
  initialPaymentType?: string;
}

export const PaymentStep = ({
  totalAmount,
  paymentMethods,
  onPaymentMethodsChange,
  initialPaymentType,
}: PaymentStepProps) => {
  const { t } = useTranslation();
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number>(0);
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "cash" | "card" | "bizum" | "bank-transfer"
  >("cash");

  useEffect(() => {
    if (initialPaymentType && paymentMethods.length === 0) {
      if (initialPaymentType.includes(":")) {
        try {
          const payments: PaymentMethod[] = initialPaymentType
            .split(", ")
            .map((payment) => {
              const [type, amount] = payment.split(":");
              return {
                type: type.trim() as
                  | "cash"
                  | "card"
                  | "bizum"
                  | "bank-transfer",
                amount: parseFloat(amount) || 0,
              };
            })
            .filter((payment) => payment.amount > 0);
          onPaymentMethodsChange(payments);
        } catch (error) {
          // Ignore parsing errors
        }
      } else {
        if (
          initialPaymentType === "cash" ||
          initialPaymentType === "card" ||
          initialPaymentType === "bizum" ||
          initialPaymentType === "bank-transfer"
        ) {
          onPaymentMethodsChange([
            {
              type: initialPaymentType as
                | "cash"
                | "card"
                | "bizum"
                | "bank-transfer",
              amount: totalAmount,
            },
          ]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPaymentType]);

  const totalPaid = paymentMethods.reduce((sum, method) => {
    const amount =
      typeof method.amount === "string"
        ? parseFloat(method.amount)
        : method.amount || 0;
    return sum + amount;
  }, 0);
  const totalCustomerGiven = paymentMethods.reduce(
    (sum, method) => sum + (method.amountTendered || method.amount || 0),
    0
  );
  const remainingAmount = totalAmount - totalPaid;
  const changeAmount = Math.max(0, totalCustomerGiven - totalAmount);

  const handleAddPayment = () => {
    if (currentPaymentAmount <= 0) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.pleaseEnterValidAmount")
      );
      return;
    }

    let actualAmount =
      currentPaymentAmount === totalAmount
        ? currentPaymentAmount
        : Math.min(currentPaymentAmount, remainingAmount);

    if (actualAmount <= 0) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.noRemainingAmount") ||
          "No remaining amount to pay. The total has already been paid."
      );
      return;
    }

    const existingMethodIndex = paymentMethods.findIndex(
      (method) => method.type === selectedPaymentType
    );

    if (existingMethodIndex !== -1) {
      const updatedMethods = [...paymentMethods];
      updatedMethods[existingMethodIndex].amount += actualAmount;
      updatedMethods[existingMethodIndex].amountTendered =
        (updatedMethods[existingMethodIndex].amountTendered || 0) +
        currentPaymentAmount;
      onPaymentMethodsChange(updatedMethods);
    } else {
      onPaymentMethodsChange([
        ...paymentMethods,
        {
          type: selectedPaymentType,
          amount: actualAmount,
          amountTendered: currentPaymentAmount,
        },
      ]);
    }

    setCurrentPaymentAmount(0);
  };

  const handleRemovePayment = (index: number) => {
    onPaymentMethodsChange(paymentMethods.filter((_, i) => i !== index));
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case "cash":
        return "./images/cash.png";
      case "card":
        return "./images/card.png";
      case "bizum":
        return "./images/bizum.png";
      case "bank-transfer":
        return "./images/bank-transfer.png";
      default:
        return "./images/cash.png";
    }
  };

  const getPaymentLabel = (type: string) => {
    switch (type) {
      case "cash":
        return t("marketPurchaseManagement.modal.cash");
      case "card":
        return t("marketPurchaseManagement.modal.card");
      case "bizum":
        return t("marketPurchaseManagement.modal.bizum");
      case "bank-transfer":
        return t("marketPurchaseManagement.modal.bankTransfer");
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {t("marketPurchaseManagement.modal.step3.title")}
      </h3>

      {/* Total Amount Display */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">
            {t("marketPurchaseManagement.modal.totalAmount")}:
          </span>
          <span className="text-2xl font-bold text-gray-900">
            €{totalAmount.toFixed(2)}
          </span>
        </div>
        {totalPaid > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">
              {t("marketPurchaseManagement.modal.step3.totalPaid")}:
            </span>
            <span className="text-lg font-semibold text-green-600">
              €{totalPaid.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-600">
            {t("marketPurchaseManagement.modal.step3.remaining")}:
          </span>
          <span
            className={`text-lg font-semibold ${
              remainingAmount > 0.01 ? "text-red-600" : "text-green-600"
            }`}
          >
            €{remainingAmount.toFixed(2)}
          </span>
        </div>
        {totalCustomerGiven > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-normal text-gray-600">
              {t("marketPurchaseManagement.modal.step3.amountTendered")}:
            </span>
            <span className="text-lg font-bold text-blue-700">
              €{totalCustomerGiven.toFixed(2)}
            </span>
          </div>
        )}
        {changeAmount > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-normal text-gray-600">
              {t("marketPurchaseManagement.modal.step3.change")}:
            </span>
            <span className="text-lg font-bold text-red-600">
              €{changeAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          {t("marketPurchaseManagement.modal.step3.selectPaymentMethod")}
        </label>
        <div className="grid grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setSelectedPaymentType("cash")}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedPaymentType === "cash"
                ? "border-green-400 bg-green-50 text-green-800"
                : "border-gray-200 hover:border-green-300"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <img src="./images/cash.png" alt="cash" className="size-10" />
              <span className="font-medium text-lg">
                {t("marketPurchaseManagement.modal.cash")}
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPaymentType("card")}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedPaymentType === "card"
                ? "border-blue-400 bg-blue-50 text-blue-800"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <img src="./images/card.png" alt="card" className="size-10" />
              <span className="font-medium text-lg">
                {t("marketPurchaseManagement.modal.card")}
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPaymentType("bizum")}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedPaymentType === "bizum"
                ? "border-purple-400 bg-purple-50 text-purple-800"
                : "border-gray-200 hover:border-purple-300"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <img src="./images/bizum.png" alt="bizum" className="size-10" />
              <span className="font-medium text-lg">
                {t("marketPurchaseManagement.modal.bizum")}
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPaymentType("bank-transfer")}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedPaymentType === "bank-transfer"
                ? "border-orange-400 bg-orange-50 text-orange-800"
                : "border-gray-200 hover:border-orange-300"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <img src="./images/bank-transfer.png" alt="bank-transfer" className="size-10" />
              <span className="font-medium text-lg">
                {t("marketPurchaseManagement.modal.bankTransfer")}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <CustomInput
          label={t("marketPurchaseManagement.modal.step3.amount")}
          name="paymentAmount"
          type="number"
          step="0.01"
          value={currentPaymentAmount.toString()}
          onChange={(e) =>
            setCurrentPaymentAmount(parseFloat(e.target.value) || 0)
          }
          placeholder="0.00"
          min="0"
        />
        <CustomButton
          type="button"
          onClick={handleAddPayment}
          label={t("marketPurchaseManagement.modal.step3.addPayment")}
          Icon={<AddIcon className="size-5" />}
          className="w-full"
        />
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">
            {t("marketPurchaseManagement.modal.step3.addedPayments")}
          </h4>
          <div className="space-y-2">
            {paymentMethods.map((method, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <img src={getPaymentIcon(method.type)} alt={method.type} className="size-10" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {getPaymentLabel(method.type)}
                    </div>
                    <div className="text-sm text-gray-600">
                      €{method.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePayment(index)}
                  className="p-2 hover:bg-red-100 rounded-full text-red-600"
                  title={t("common.delete")}
                >
                  <DeleteIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
