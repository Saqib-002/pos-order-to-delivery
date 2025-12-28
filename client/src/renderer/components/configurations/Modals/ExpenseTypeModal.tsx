import { useEffect, useState } from "react";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import { CrossIcon } from "@/renderer/public/Svg";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

interface ExpenseTypeModalProps {
  onClose: () => void;
  mode: "add" | "edit" | "view";
  expenseType?: any;
  token: string | null;
  onSuccess?: () => void;
}

export const ExpenseTypeModal: React.FC<ExpenseTypeModalProps> = ({
  onClose,
  mode,
  expenseType,
  token,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [expenseTypeName, setExpenseTypeName] = useState("");

  useEffect(() => {
    if (expenseType && (mode === "edit" || mode === "view")) {
      setExpenseTypeName(expenseType.name);
    } else {
      setExpenseTypeName("");
    }
  }, [expenseType, mode]);

  const isViewMode = mode === "view";
  const isAddOrEditMode = mode === "add" || mode === "edit";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === "view") return;

    if (!expenseTypeName.trim()) {
      toast.error(t("expenseTypeModal.errors.pleaseEnterExpenseTypeName"));
      return;
    }

    const payload = {
      name: expenseTypeName.trim(),
    };

    let res;
    try {
      if (mode === "add") {
        res = await (window as any).electronAPI.createExpenseType(
          token,
          payload
        );
      } else {
        res = await (window as any).electronAPI.updateExpenseType(
          token,
          expenseType.id,
          payload
        );
      }
      if (!res.status) {
        if (res.error?.includes("already exists")) {
          toast.warn(t("expenseTypeModal.warnings.expenseTypeAlreadyAdded"));
          return;
        }
        const errorMsg =
          mode === "add"
            ? t("expenseTypeModal.errors.unableToAddExpenseType")
            : t("expenseTypeModal.errors.unableToUpdateExpenseType");
        toast.error(errorMsg);
        return;
      }
      const successMsg =
        mode === "add"
          ? t("expenseTypeModal.messages.expenseTypeAddedSuccessfully")
          : t("expenseTypeModal.messages.expenseTypeUpdatedSuccessfully");
      toast.success(successMsg);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(t("expenseTypeModal.errors.anErrorOccurred"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={onSubmit} className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold">
              {mode === "view"
                ? t("expenseTypeModal.viewExpenseType")
                : mode === "edit"
                  ? t("expenseTypeModal.editExpenseType")
                  : t("expenseTypeModal.addNewExpenseType")}
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
                label={t("expenseTypeModal.expenseTypeName")}
                name="name"
                type="text"
                placeholder={t("expenseTypeModal.enterExpenseTypeName")}
                value={expenseTypeName}
                onChange={(e) => setExpenseTypeName(e.target.value)}
                inputClasses="py-3 px-4"
                readOnly={isViewMode}
                required={isAddOrEditMode}
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
                      ? t("expenseTypeModal.updateExpenseType")
                      : t("expenseTypeModal.addExpenseType")
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
