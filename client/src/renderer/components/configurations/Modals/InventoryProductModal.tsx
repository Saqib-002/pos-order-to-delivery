import { useEffect, useState } from "react";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import { CrossIcon } from "@/renderer/public/Svg";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

interface InventoryProductModalProps {
  onClose: () => void;
  mode: "add" | "edit" | "view";
  product?: any;
  token: string | null;
  onSuccess?: () => void;
}

export const InventoryProductModal: React.FC<InventoryProductModalProps> = ({
  onClose,
  mode,
  product,
  token,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [productName, setProductName] = useState("");

  useEffect(() => {
    if (product && (mode === "edit" || mode === "view")) {
      setProductName(product.name);
    } else {
      setProductName("");
    }
  }, [product, mode]);

  const isViewMode = mode === "view";
  const isAddOrEditMode = mode === "add" || mode === "edit";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === "view") return;

    if (!productName.trim()) {
      toast.error(t("inventoryModal.errors.pleaseEnterProductName"));
      return;
    }

    const payload = {
      name: productName.trim(),
    };

    let res;
    try {
      if (mode === "add") {
        res = await (window as any).electronAPI.createInventoryProduct(
          token,
          payload
        );
      } else {
        res = await (window as any).electronAPI.updateInventoryProduct(
          token,
          product.id,
          payload
        );
      }
      if (!res.status) {
        if (res.error?.includes("already exists")) {
          toast.warn(t("inventoryModal.warnings.productAlreadyAdded"));
          return;
        }
        const errorMsg =
          mode === "add"
            ? t("inventoryModal.errors.unableToAddProduct")
            : t("inventoryModal.errors.unableToUpdateProduct");
        toast.error(errorMsg);
        return;
      }
      const successMsg =
        mode === "add"
          ? t("inventoryModal.messages.productAddedSuccessfully")
          : t("inventoryModal.messages.productUpdatedSuccessfully");
      toast.success(successMsg);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(t("inventoryModal.errors.anErrorOccurred"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={onSubmit} className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold">
              {mode === "view"
                ? t("inventoryModal.viewProduct")
                : mode === "edit"
                  ? t("inventoryModal.editProduct")
                  : t("inventoryModal.addNewProduct")}
            </h3>
            <CustomButton
              type="button"
              variant="transparent"
              onClick={onClose}
              Icon={<CrossIcon className="size-5" />}
              className="!p-0"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-6">
              <CustomInput
                label={t("inventoryModal.productName")}
                name="name"
                type="text"
                placeholder={t("inventoryModal.enterProductName")}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
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
                      ? t("inventoryModal.updateProduct")
                      : t("inventoryModal.addProduct")
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
