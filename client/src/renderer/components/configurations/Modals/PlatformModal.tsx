import { useEffect, useState } from "react";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import { CrossIcon } from "@/renderer/public/Svg";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

interface PlatformModalProps {
  onClose: () => void;
  mode: "add" | "edit" | "view";
  platform?: any;
  token: string | null;
  onSuccess?: () => void;
}

export const PlatformModal: React.FC<PlatformModalProps> = ({
  onClose,
  mode,
  platform,
  token,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [platformName, setPlatformName] = useState("");

  useEffect(() => {
    if (platform && (mode === "edit" || mode === "view")) {
      setPlatformName(platform.name);
    } else {
      setPlatformName("");
    }
  }, [platform, mode]);

  const isViewMode = mode === "view";
  const isAddOrEditMode = mode === "add" || mode === "edit";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === "view") return;

    if (!platformName.trim()) {
      toast.error(t("platformModal.errors.pleaseEnterPlatformName"));
      return;
    }

    const payload = {
      name: platformName.trim(),
    };

    let res;
    try {
      if (mode === "add") {
        res = await (window as any).electronAPI.createPlatform(token, payload);
      } else {
        res = await (window as any).electronAPI.updatePlatform(
          token,
          platform.id,
          payload
        );
      }
      if (!res.status) {
        if (res.error?.includes("already exists")) {
          toast.warn(t("platformModal.warnings.platformAlreadyAdded"));
          return;
        }
        const errorMsg =
          mode === "add"
            ? t("platformModal.errors.unableToAddPlatform")
            : t("platformModal.errors.unableToUpdatePlatform");
        toast.error(errorMsg);
        return;
      }
      const successMsg =
        mode === "add"
          ? t("platformModal.messages.platformAddedSuccessfully")
          : t("platformModal.messages.platformUpdatedSuccessfully");
      toast.success(successMsg);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(t("platformModal.errors.anErrorOccurred"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={onSubmit} className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold">
              {mode === "view"
                ? t("platformModal.viewPlatform")
                : mode === "edit"
                  ? t("platformModal.editPlatform")
                  : t("platformModal.addNewPlatform")}
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
                label={t("platformModal.platformName")}
                name="name"
                type="text"
                placeholder={t("platformModal.enterPlatformName")}
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
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
                      ? t("platformModal.updatePlatform")
                      : t("platformModal.addPlatform")
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
