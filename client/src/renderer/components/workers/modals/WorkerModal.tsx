import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Worker } from "@/types/workers";
import CustomInput from "../../shared/CustomInput";
import { CustomSelect } from "../../ui/CustomSelect";
import CustomButton from "../../ui/CustomButton";
import { DatePicker } from "../../ui/shadcn/date-picker";
import { CrossIcon } from "../../../public/Svg";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Worker>) => Promise<boolean>;
  initialData?: Worker | null;
}

export const WorkerModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: Props) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Worker>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) onClose();
  };

  const getInputValue = (dateVal: string | Date | undefined) => {
    if (!dateVal) return "";
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split("T")[0];
    }
    if (typeof dateVal === "string") {
      return dateVal.split("T")[0];
    }
    return "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {initialData
                ? t("common.edit") +
                  " " +
                  t("workerManagement.table.workers").slice(0, -1)
                : t("workerManagement.addWorker")}
            </h3>
            <CustomButton
              type="button"
              variant="transparent"
              onClick={onClose}
              Icon={<CrossIcon className="size-6" />}
              className="text-white hover:text-gray-500 !p-2 !rounded-full hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>

        <div className="p-8 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <CustomInput
              name="fullname"
              type="text"
              label={t("userManagement.modal.fullName")}
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              inputClasses="py-2"
            />
          </div>

          <DatePicker
            label={t("workerManagement.modal.dateOfBirth")}
            value={formData.dateOfBirth}
            onChange={(value) =>
              setFormData({ ...formData, dateOfBirth: value })
            }
            placeholder="Select date of birth"
          />

          <CustomInput
            name="id"
            type="tel"
            label="ID Number (DNI/NIE)"
            value={formData.idNumber || ""}
            onChange={(e) =>
              setFormData({ ...formData, idNumber: e.target.value })
            }
            inputClasses="py-2"
          />

          <CustomInput
            name="phone"
            type="tel"
            label={t("userManagement.modal.phoneNumber")}
            value={formData.phoneNumber || ""}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            inputClasses="py-2"
          />

          <div className="col-span-2 border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Banking Details
            </h4>
          </div>

          <CustomInput
            type="text"
            name="bankName"
            label="Bank Name"
            value={formData.bankName || ""}
            onChange={(e) =>
              setFormData({ ...formData, bankName: e.target.value })
            }
            inputClasses="py-2"
          />
          <CustomInput
            type="tel"
            name="account"
            label="Account Number"
            value={formData.bankAccountNumber || ""}
            onChange={(e) =>
              setFormData({ ...formData, bankAccountNumber: e.target.value })
            }
            inputClasses="py-2"
          />
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <CustomButton
            type="button"
            variant="secondary"
            onClick={onClose}
            label={t("common.cancel")}
            className="hover:scale-105"
          />
          <CustomButton
            type="submit"
            label={t("common.save")}
            className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-gray-900 hover:scale-105"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};
