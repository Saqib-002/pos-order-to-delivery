import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Income } from "@/types/incomes";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import { DatePicker } from "../ui/DatePicker";
import { CustomSelect } from "../ui/CustomSelect";
import {
  CrossIcon,
} from "../../public/Svg";
import dayjs from "dayjs";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Income) => Promise<boolean>;
  initialData?: Income | null;
}

export const CashOutModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: Props) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Income>>({
    name: "",
    description: "",
    total: 0,
    date: dayjs().format("YYYY-MM-DD"),
    paymentType: "cash",
    transactionType: "out",
  });
  const [totalRaw, setTotalRaw] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
        });
        setTotalRaw(initialData.total.toString());
      } else {
        setFormData({
          name: "",
          description: "",
          total: 0,
          date: dayjs().format("YYYY-MM-DD"),
          paymentType: "cash",
          transactionType: "out",
        });
        setTotalRaw("");
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    if (!formData.name || !formData.name.trim()) {
      toast.error(t("cashOutManagement.modal.errors.reasonRequired"));
      return false;
    }
    if (!totalRaw || parseFloat(totalRaw) <= 0) {
      toast.error(t("cashOutManagement.modal.errors.amountRequired"));
      return false;
    }
    if (!formData.date) {
      toast.error(t("cashOutManagement.modal.errors.dateRequired"));
      return false;
    }
    if (!formData.transactionType) {
      toast.error(t("cashOutManagement.modal.errors.typeRequired"));
      return false;
    }
    return true;
  };

  const handleFinalSubmit = async () => {
    if (!validate()) {
      return;
    }

    const otherIncomesData: Income = {
      ...formData,
      total: parseFloat(totalRaw) || 0,
      date: formData.date!,
      paymentType: "cash",
    } as Income;

    const success = await onSubmit(otherIncomesData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="bg-linear-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold">
              {initialData
                ? t("cashOutManagement.modal.editTitle")
                : t("cashOutManagement.modal.addTitle")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <CrossIcon className="size-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <div className="space-y-6">
            <CustomInput
              label={t("cashOutManagement.modal.reason")}
              name="name"
              type="text"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t("cashOutManagement.modal.reasonPlaceholder")}
            />
            <CustomInput
              label={t("cashOutManagement.modal.amount")}
              name="total"
              type="number"
              step="0.01"
              value={totalRaw}
              onChange={(e) => setTotalRaw(e.target.value)}
              min="0"
            />
            <DatePicker
              label={t("cashOutManagement.modal.date")}
              value={formData.date || ""}
              onChange={(date) => setFormData({ ...formData, date: date || "" })}
            />
            <CustomSelect
              label={t("cashOutManagement.modal.type")}
              options={[
                { value: "in", label: t("cashOutManagement.modal.in") },
                { value: "out", label: t("cashOutManagement.modal.out") },
              ]}
              value={formData.transactionType || "out"}
              onChange={(val) => setFormData({ ...formData, transactionType: val as 'in' | 'out' })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 px-8 pb-8 border-t border-gray-200 shrink-0">
          <CustomButton
            type="button"
            variant="secondary"
            onClick={onClose}
            label={t("common.cancel")}
          />
          <CustomButton
            type="button"
            onClick={handleFinalSubmit}
            label={
              initialData
                ? t("common.update")
                : t("common.save")
            }
          />
        </div>
      </div>
    </div>
  );
};
