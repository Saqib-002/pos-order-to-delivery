import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Expense } from "@/types/expenses";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { DatePicker } from "../../ui/shadcn/date-picker";
import { useConfirm } from "../../../hooks/useConfirm";
import {
  CrossIcon,
  AddIcon,
  DeleteIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../../public/Svg";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Expense) => Promise<boolean>;
  initialData?: Expense | null;
}

interface PaymentMethod {
  type: "cash" | "card";
  amount: number;
}

export const ExpenseModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: Props) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Expense>>({
    name: "",
    description: "",
    total: 0,
    date: new Date().toISOString().split("T")[0],
    paymentType: "cash",
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number>(0);
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "cash" | "card"
  >("cash");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
        if (initialData.paymentType) {
          if (initialData.paymentType.includes(":")) {
            try {
              const payments: PaymentMethod[] = initialData.paymentType
                .split(", ")
                .map((payment) => {
                  const [type, amount] = payment.split(":");
                  return {
                    type: type.trim() as "cash" | "card",
                    amount: parseFloat(amount) || 0,
                  };
                })
                .filter((payment) => payment.amount > 0);
              setPaymentMethods(payments);
            } catch (error) {
              setPaymentMethods([]);
            }
          } else {
            if (
              initialData.paymentType === "cash" ||
              initialData.paymentType === "card"
            ) {
              const amount =
                typeof initialData.total === "string"
                  ? parseFloat(initialData.total)
                  : initialData.total || 0;
              setPaymentMethods([
                {
                  type: initialData.paymentType as "cash" | "card",
                  amount: isNaN(amount) ? 0 : amount,
                },
              ]);
            }
          }
        }
        setCurrentStep(1);
      } else {
        setFormData({
          name: "",
          description: "",
          total: 0,
          date: new Date().toISOString().split("T")[0],
          paymentType: "cash",
        });
        setPaymentMethods([]);
        setCurrentStep(1);
      }
      setCurrentPaymentAmount(0);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddPayment = () => {
    if (currentPaymentAmount <= 0) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.pleaseEnterValidAmount")
      );
      return;
    }

    const totalAmount =
      typeof formData.total === "number"
        ? formData.total
        : parseFloat(String(formData.total || 0)) || 0;
    const totalPaid = paymentMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );
    const remainingAmount = totalAmount - totalPaid;
    const actualAmount = Math.min(currentPaymentAmount, remainingAmount);

    const existingMethodIndex = paymentMethods.findIndex(
      (method) => method.type === selectedPaymentType
    );

    if (existingMethodIndex !== -1) {
      const updatedMethods = [...paymentMethods];
      updatedMethods[existingMethodIndex].amount += actualAmount;
      setPaymentMethods(updatedMethods);
    } else {
      setPaymentMethods([
        ...paymentMethods,
        {
          type: selectedPaymentType,
          amount: actualAmount,
        },
      ]);
    }

    setCurrentPaymentAmount(0);
  };

  const handleRemovePayment = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const validateStep1 = (): boolean => {
    if (!formData.name || !formData.name.trim()) {
      toast.error(t("expenseManagement.modal.errors.nameRequired"));
      return false;
    }
    if (!formData.total || formData.total <= 0) {
      toast.error(t("expenseManagement.modal.errors.totalRequired"));
      return false;
    }
    if (!formData.date) {
      toast.error(t("expenseManagement.modal.errors.dateRequired"));
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const totalAmount =
      typeof formData.total === "number"
        ? formData.total
        : parseFloat(String(formData.total || 0)) || 0;
    const totalPaid = paymentMethods.reduce(
      (sum, method) => sum + method.amount,
      0
    );

    if (paymentMethods.length === 0) {
      toast.error(t("marketPurchaseManagement.modal.errors.paymentRequired"));
      return false;
    }

    if (totalPaid < totalAmount) {
      toast.error(
        t("marketPurchaseManagement.modal.errors.paymentIncomplete", {
          remaining: (totalAmount - totalPaid).toFixed(2),
        })
      );
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    const totalAmount =
      typeof formData.total === "number"
        ? formData.total
        : parseFloat(String(formData.total || 0)) || 0;
    const paymentTypeString = paymentMethods
      .map((method) => `${method.type}:${method.amount}`)
      .join(", ");

    const expenseData: Expense = {
      ...formData,
      name: formData.name!,
      total: Number(totalAmount),
      date: formData.date!,
      paymentType: paymentTypeString,
    } as Expense;

    const success = await onSubmit(expenseData);
    if (success) {
      onClose();
      setFormData({
        name: "",
        description: "",
        total: 0,
        date: new Date().toISOString().split("T")[0],
        paymentType: "cash",
      });
      setPaymentMethods([]);
      setCurrentStep(1);
      setCurrentPaymentAmount(0);
    }
  };

  const totalAmount =
    typeof formData.total === "number"
      ? formData.total
      : parseFloat(String(formData.total || 0)) || 0;
  const totalPaid = paymentMethods.reduce((sum, method) => {
    const amount =
      typeof method.amount === "string"
        ? parseFloat(method.amount)
        : method.amount || 0;
    return sum + amount;
  }, 0);
  const remainingAmount = totalAmount - totalPaid;

  const renderStep1 = () => (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {t("expenseManagement.modal.step1.title")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <CustomInput
            label={t("expenseManagement.modal.name")}
            name="name"
            type="text"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t("expenseManagement.modal.enterName")}
          />
        </div>
        <div className="md:col-span-2">
          <CustomInput
            label={t("expenseManagement.modal.description")}
            name="description"
            type="text"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder={t("expenseManagement.modal.enterDescription")}
          />
        </div>
        <DatePicker
          label={t("expenseManagement.modal.date")}
          value={formData.date || ""}
          onChange={(date) => setFormData({ ...formData, date: date || "" })}
          placeholder={t("expenseManagement.modal.selectDate")}
        />
        <CustomInput
          label={t("expenseManagement.modal.total")}
          name="total"
          type="number"
          step="0.01"
          value={formData.total?.toString() || "0"}
          onChange={(e) =>
            setFormData({
              ...formData,
              total: parseFloat(e.target.value) || 0,
            })
          }
          min="0"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 max-w-xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {t("expenseManagement.modal.step2.title")}
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
        {remainingAmount > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">
              {t("marketPurchaseManagement.modal.step3.remaining")}:
            </span>
            <span className="text-lg font-semibold text-red-600">
              €{remainingAmount.toFixed(2)}
            </span>
          </div>
        )}
        {totalPaid > totalAmount && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">
              {t("marketPurchaseManagement.modal.step3.change")}:
            </span>
            <span className="text-lg font-semibold text-blue-600">
              €{(totalPaid - totalAmount).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          {t("marketPurchaseManagement.modal.step3.selectPaymentMethod")}
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSelectedPaymentType("cash")}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              selectedPaymentType === "cash"
                ? "border-green-400 bg-green-50 text-green-800"
                : "border-gray-200 hover:border-green-300"
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">💵</span>
              <span className="font-medium text-lg">
                {t("marketPurchaseManagement.modal.cash")}
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPaymentType("card")}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              selectedPaymentType === "card"
                ? "border-blue-400 bg-blue-50 text-blue-800"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">💳</span>
              <span className="font-medium text-lg">
                {t("marketPurchaseManagement.modal.card")}
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
                  <span className="text-2xl">
                    {method.type === "cash" ? "💵" : "💳"}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {method.type}
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${
          currentStep === 1 ? "max-w-2xl" : "max-w-xl"
        }`}
      >
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">
              {initialData
                ? t("expenseManagement.modal.editTitle")
                : t("expenseManagement.modal.addTitle")}
            </h2>
            <div className="flex gap-2 mt-2">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`h-2 rounded-full transition-all ${
                    currentStep === step
                      ? "bg-white w-8"
                      : currentStep > step
                        ? "bg-gray-400 w-6"
                        : "bg-gray-600 w-6"
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <CrossIcon className="size-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4 pt-4 px-8 pb-8 border-t border-gray-200 flex-shrink-0">
          <div>
            {currentStep > 1 && (
              <CustomButton
                type="button"
                variant="secondary"
                onClick={handlePrevious}
                label={t("marketPurchaseManagement.modal.previous")}
                Icon={<ChevronLeftIcon className="size-5" />}
              />
            )}
          </div>
          <div className="flex gap-4">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={onClose}
              label={t("common.cancel")}
            />
            {currentStep < 2 ? (
              <CustomButton
                type="button"
                onClick={handleNext}
                label={
                  <span className="flex items-center gap-2">
                    {t("marketPurchaseManagement.modal.next")}
                    <ChevronRightIcon className="size-5" />
                  </span>
                }
              />
            ) : (
              <CustomButton
                type="button"
                onClick={handleFinalSubmit}
                label={
                  initialData
                    ? t("common.update")
                    : t("expenseManagement.modal.complete")
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
