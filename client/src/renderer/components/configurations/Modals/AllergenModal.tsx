import React, { useEffect, useState } from "react";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import { CrossIcon, ImgIcon } from "@/renderer/public/Svg";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import TranslateButton from "../../webAdmin/TranslateButton";

interface AllergenModalProps {
  onClose: () => void;
  mode: "add" | "edit" | "view";
  allergen?: any;
  token: string | null;
  onSuccess?: () => void;
}

export const AllergenModal: React.FC<AllergenModalProps> = ({
  onClose,
  mode,
  allergen,
  token,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [nameEs, setNameEs] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  useEffect(() => {
    if (allergen && (mode === "edit" || mode === "view")) {
      setNameEs(allergen.nameEs || "");
      setNameEn(allergen.nameEn || "");
      setIconPreview(allergen.icon || null);
    } else {
      setNameEs("");
      setNameEn("");
      setIconPreview(null);
    }
  }, [allergen, mode]);

  const isViewMode = mode === "view";

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setIconPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeIcon = () => {
    if (isViewMode) return;
    setIconPreview(null);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === "view") return;

    if (!nameEs.trim()) {
      toast.error(t("allergensModal.errors.pleaseEnterNameEs", "Por favor ingresa el nombre en español"));
      return;
    }

    const payload = {
      nameEs: nameEs.trim(),
      nameEn: nameEn.trim(),
      icon: iconPreview,
    };

    try {
      let res;
      if (mode === "add") {
        res = await (window as any).electronAPI.createAllergen(token, payload);
      } else {
        res = await (window as any).electronAPI.updateAllergen(token, allergen.id, payload);
      }

      if (!res.status) {
        if (res.error?.includes("already exists")) {
          toast.warn(t("allergensModal.warnings.allergenAlreadyAdded", "Un alérgeno con este nombre ya existe"));
          return;
        }
        const errorMsg =
          mode === "add"
            ? t("allergensModal.errors.unableToAddAllergen", "No se pudo agregar el alérgeno")
            : t("allergensModal.errors.unableToUpdateAllergen", "No se pudo actualizar el alérgeno");
        toast.error(errorMsg);
        return;
      }

      const successMsg =
        mode === "add"
          ? t("allergensModal.messages.allergenAddedSuccessfully", "Alérgeno registrado exitosamente")
          : t("allergensModal.messages.allergenUpdatedSuccessfully", "Alérgeno actualizado exitosamente");
      toast.success(successMsg);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(t("allergensModal.errors.anErrorOccurred", "Ocurrió un error inesperado"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={onSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              {mode === "view"
                ? t("allergensModal.viewTitle", "Ver Alérgeno")
                : mode === "edit"
                  ? t("allergensModal.editTitle", "Editar Alérgeno")
                  : t("allergensModal.addTitle", "Registrar Nuevo Alérgeno")}
            </h3>
            <CustomButton
              type="button"
              variant="transparent"
              Icon={<CrossIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />}
              onClick={onClose}
              title={t("allergensModal.close", "Cerrar")}
            />
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("allergensModal.iconLabel", "Icono del Alérgeno")}
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                  {iconPreview ? (
                    <img
                      crossOrigin="anonymous"
                      src={iconPreview}
                      alt="Icon Preview"
                      className="w-full h-full object-contain p-2 filter invert brightness-200"
                    />
                  ) : (
                    <ImgIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {!isViewMode && (
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors border border-gray-300">
                      {iconPreview
                        ? t("allergensModal.changeIcon", "Cambiar Icono")
                        : t("allergensModal.uploadIcon", "Subir Icono")}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIconChange}
                        className="hidden"
                      />
                    </label>
                    {iconPreview && (
                      <button
                        type="button"
                        onClick={removeIcon}
                        className="text-xs text-red-600 hover:text-red-800 font-medium self-start"
                      >
                        {t("allergensModal.removeIcon", "Quitar Icono")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Name in Spanish */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">
                  {t("allergensModal.nameEsLabel", "Nombre en Español *")}
                </label>
                {!isViewMode && (
                  <TranslateButton
                    value={nameEs}
                    direction="es→en"
                    onTranslated={(res) => setNameEn(res)}
                  />
                )}
              </div>
              <CustomInput
                name="nameEs"
                type="text"
                placeholder={t("allergensModal.nameEsPlaceholder", "Ej: Gluten, Huevos, Lactosa...")}
                value={nameEs}
                onChange={(e: any) => setNameEs(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            {/* Name in English */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">
                  {t("allergensModal.nameEnLabel", "Nombre en Inglés")}
                </label>
                {!isViewMode && (
                  <TranslateButton
                    value={nameEn}
                    direction="en→es"
                    onTranslated={(res) => setNameEs(res)}
                  />
                )}
              </div>
              <CustomInput
                name="nameEn"
                type="text"
                placeholder={t("allergensModal.nameEnPlaceholder", "Ej: Gluten, Eggs, Milk...")}
                value={nameEn}
                onChange={(e: any) => setNameEn(e.target.value)}
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={onClose}
              label={isViewMode ? t("allergensModal.close", "Cerrar") : t("allergensModal.cancel", "Cancelar")}
            />
            {!isViewMode && (
              <CustomButton
                type="submit"
                variant="primary"
                label={mode === "add" ? t("allergensModal.register", "Registrar Alérgeno") : t("allergensModal.saveChanges", "Guardar Cambios")}
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
