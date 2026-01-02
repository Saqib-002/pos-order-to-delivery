import { useEffect, useState } from "react";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import { CrossIcon } from "@/renderer/public/Svg";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

interface IncomeSourceModalProps {
  onClose: () => void;
  mode: "add" | "edit" | "view";
  incomeSource?: any;
  token: string | null;
  onSuccess?: () => void;
}

export const IncomeSourceModal: React.FC<IncomeSourceModalProps> = ({
  onClose,
  mode,
  incomeSource,
  token,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [incomeSourceName, setIncomeSourceName] = useState("");
  const [incomeSourceDescription, setIncomeSourceDescription] = useState("");

  useEffect(() => {
    if (incomeSource && (mode === "edit" || mode === "view")) {
      setIncomeSourceName(incomeSource.name);
      setIncomeSourceDescription(incomeSource.description || "");
    } else {
      setIncomeSourceName("");
      setIncomeSourceDescription("");
    }
  }, [incomeSource, mode]);

  const isViewMode = mode === "view";
  const isAddOrEditMode = mode === "add" || mode === "edit";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === "view") return;

    if (!incomeSourceName.trim()) {
      toast.error(t("incomeSourceModal.errors.pleaseEnterIncomeSourceName"));
      return;
    }

    const payload = {
      name: incomeSourceName.trim(),
      description: incomeSourceDescription.trim() || null,
    };

    let res;
    try {
      if (mode === "add") {
        res = await (window as any).electronAPI.createIncomeSource(
          token,
          payload
        );
      } else {
        res = await (window as any).electronAPI.updateIncomeSource(
          token,
          incomeSource.id,
          payload
        );
      }
      if (!res.status) {
        if (res.error?.includes("already exists")) {
          toast.warn(t("incomeSourceModal.warnings.incomeSourceAlreadyAdded"));
          return;
        }
        const errorMsg =
          mode === "add"
            ? t("incomeSourceModal.errors.unableToAddIncomeSource")
            : t("incomeSourceModal.errors.unableToUpdateIncomeSource");
        toast.error(errorMsg);
        return;
      }
      const successMsg =
        mode === "add"
          ? t("incomeSourceModal.messages.incomeSourceAddedSuccessfully")
          : t("incomeSourceModal.messages.incomeSourceUpdatedSuccessfully");
      toast.success(successMsg);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(t("incomeSourceModal.errors.anErrorOccurred"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={onSubmit} className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold">
              {mode === "view"
                ? t("incomeSourceModal.viewIncomeSource")
                : mode === "edit"
                  ? t("incomeSourceModal.editIncomeSource")
                  : t("incomeSourceModal.addNewIncomeSource")}
            </h3>
            <CustomButton
              type="button"
              variant="transparent"
              onClick={onClose}
              Icon={<CrossIcon className="size-5" />}
              className="p-0!"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-6">
              <CustomInput
                label={t("incomeSourceModal.incomeSourceName")}
                name="name"
                type="text"
                placeholder={t("incomeSourceModal.enterIncomeSourceName")}
                value={incomeSourceName}
                onChange={(e) => setIncomeSourceName(e.target.value)}
                inputClasses="py-3 px-4"
                readOnly={isViewMode}
                required={isAddOrEditMode}
              />
              <CustomInput
                label={t("incomeSourceModal.incomeSourceDescription")}
                name="description"
                type="text"
                placeholder={t(
                  "incomeSourceModal.enterIncomeSourceDescription"
                )}
                value={incomeSourceDescription}
                onChange={(e) => setIncomeSourceDescription(e.target.value)}
                inputClasses="py-3 px-4"
                readOnly={isViewMode}
                required={false}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 p-6 border-t border-gray-200">
            {isViewMode ? (
              <CustomButton
                type="button"
                label={t("common.close")}
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600"
              />
            ) : (
              <>
                <CustomButton
                  type="button"
                  label={t("common.cancel")}
                  onClick={onClose}
                  variant="transparent"
                  className="border border-gray-300"
                />
                <CustomButton
                  type="submit"
                  label={
                    mode === "edit"
                      ? t("incomeSourceModal.updateIncomeSource")
                      : t("incomeSourceModal.addIncomeSource")
                  }
                  className="bg-black hover:scale-105"
                />
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
