import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Expense } from "@/types/expenses";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { DatePicker } from "../../ui/DatePicker";
import { useConfirm } from "../../../hooks/useConfirm";
import {
  CrossIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../../public/Svg";
import { PaymentStep, PaymentMethod } from "../../shared/PaymentStep";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Expense) => Promise<boolean>;
  initialData?: Expense | null;
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
    ticketId: "",
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

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
                    type: type.trim() as
                      | "cash"
                      | "card"
                      | "bizum"
                      | "bank-transfer",
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
              initialData.paymentType === "card" ||
              initialData.paymentType === "bizum" ||
              initialData.paymentType === "bank-transfer"
            ) {
              const amount =
                typeof initialData.total === "string"
                  ? parseFloat(initialData.total)
                  : initialData.total || 0;
              setPaymentMethods([
                {
                  type: initialData.paymentType as
                    | "cash"
                    | "card"
                    | "bizum"
                    | "bank-transfer",
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
          ticketId: "",
        });
        setPaymentMethods([]);
        setCurrentStep(1);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

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
    // Allow pending payments - no validation needed
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
    const paymentTypeString =
      paymentMethods.length > 0
        ? paymentMethods
            .map((method) => `${method.type}:${method.amount}`)
            .join(", ")
        : "";

    const expenseData: Expense = {
      ...formData,
      name: formData.name!,
      total: Number(totalAmount),
      date: formData.date!,
      paymentType: paymentTypeString,
      ticketId: formData.ticketId || undefined,
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
        ticketId: "",
      });
      setPaymentMethods([]);
      setCurrentStep(1);
    }
  };

  const totalAmount =
    typeof formData.total === "number"
      ? formData.total
      : parseFloat(String(formData.total || 0)) || 0;

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
        <div className="md:col-span-2">
          <CustomInput
            label={t("expenseManagement.modal.ticketId")}
            name="ticketId"
            type="text"
            value={formData.ticketId || ""}
            onChange={(e) =>
              setFormData({ ...formData, ticketId: e.target.value })
            }
            placeholder={t("expenseManagement.modal.enterTicketId")}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <PaymentStep
      totalAmount={totalAmount}
      paymentMethods={paymentMethods}
      onPaymentMethodsChange={setPaymentMethods}
      initialPaymentType={initialData?.paymentType}
    />
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
