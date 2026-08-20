import { colorOptions } from "@/renderer/utils/utils";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { CrossIcon, ImgIcon } from "@/renderer/public/Svg";
import { useTranslation } from "react-i18next";

interface Category {
  id: string;
  name: string;
  itemCount?: number;
  color: string;
  type: "category" | "subcategory";
  imgUrl?: string;
  bannerImgUrl?: string;
  priority?: number;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCategory?: Category | null;
  token: string | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token,
  editingCategory,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    color: "red",
    imgUrl: "",
    bannerImgUrl: "",
    priority: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Get color classes for selection ring
  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return "border-gray-200 hover:border-gray-300";
    }

    const colorMap: Record<string, string> = {
      red: "border-red-500 ring-2 ring-red-500 ring-opacity-50",
      blue: "border-blue-500 ring-2 ring-blue-500 ring-opacity-50",
      green: "border-green-500 ring-2 ring-green-500 ring-opacity-50",
      purple: "border-purple-500 ring-2 ring-purple-500 ring-opacity-50",
      orange: "border-orange-500 ring-2 ring-orange-500 ring-opacity-50",
      pink: "border-pink-500 ring-2 ring-pink-500 ring-opacity-50",
      indigo: "border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50",
      yellow: "border-yellow-500 ring-2 ring-yellow-500 ring-opacity-50",
      gray: "border-gray-500 ring-2 ring-gray-500 ring-opacity-50",
    };

    return (
      colorMap[color] || "border-gray-500 ring-2 ring-gray-500 ring-opacity-50"
    );
  };

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        color: editingCategory.color,
        imgUrl: editingCategory.imgUrl || "",
        bannerImgUrl: (editingCategory as any).bannerImgUrl || "",
        priority: (editingCategory as any).priority || 0,
      });
    } else {
      setFormData({
        name: "",
        color: "red",
        imgUrl: "",
        bannerImgUrl: "",
        priority: 0,
      });
    }
  }, [editingCategory, isOpen]);

  // Icon image handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData((prev) => ({ ...prev, imgUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imgUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Mobile banner image handler
  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData((prev) => ({ ...prev, bannerImgUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBannerImage = () => {
    setFormData((prev) => ({ ...prev, bannerImgUrl: "" }));
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("menuComponents.modals.categoryModal.errors.nameRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      let res;
      const payload = {
        categoryName: formData.name,
        color: formData.color,
        imgUrl: formData.imgUrl,
        bannerImgUrl: formData.bannerImgUrl,
        priority: Number(formData.priority) || 0,
      };

      if (editingCategory) {
        res = await (window as any).electronAPI.updateCategory(
          token,
          editingCategory.id,
          payload
        );
      } else {
        res = await (window as any).electronAPI.createCategory(token, payload);
      }
      if (!res.status) {
        toast.error(
          editingCategory
            ? t("menuComponents.modals.categoryModal.errors.failedToEdit")
            : t("menuComponents.modals.categoryModal.errors.failedToSave")
        );
        return;
      }
      toast.success(
        editingCategory
          ? t("menuComponents.modals.categoryModal.success.updated")
          : t("menuComponents.modals.categoryModal.success.created")
      );
      onSuccess();
    } catch (error) {
      toast.error(t("menuComponents.modals.categoryModal.errors.failedToSave"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">
            {editingCategory
              ? t("menuComponents.modals.categoryModal.editTitle")
              : t("menuComponents.modals.categoryModal.title")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Wrap name and icon image in a flex container */}
          <div className="flex items-start gap-4 mb-4">
            <CustomInput
              label={t("menuComponents.modals.categoryModal.categoryName")}
              name="categoryName"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder={t(
                "menuComponents.modals.categoryModal.enterCategoryName"
              )}
              otherClasses="flex-1"
            />

            {/* Icon Image Upload */}
            <div className="w-28 flex-shrink-0">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("menuComponents.modals.categoryModal.image")}
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-1 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 flex items-center justify-center touch-manipulation">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {formData.imgUrl ? (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <img
                        crossOrigin="anonymous"
                        src={formData.imgUrl}
                        alt="Category Icon Preview"
                        className="size-9 object-cover rounded shadow-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md hover:bg-gray-100 transition-colors"
                      >
                        <CrossIcon className="size-3 text-gray-600 hover:text-gray-800" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500 text-xs">
                    <ImgIcon className="size-9" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Priority & Mobile Banner Image */}
          <div className="mb-4">
            <CustomInput
              label={t("menuComponents.modals.categoryModal.priority", "Prioridad (Orden)")}
              name="priority"
              type="number"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
              }
              placeholder={t("menuComponents.modals.categoryModal.enterPriority", "Ingrese prioridad")}
            />
          </div>

          {/* Mobile Banner Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("menuComponents.modals.categoryModal.bannerImage", "IMAGEN DE BANNER (MÓVIL)")}
            </label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 flex items-center justify-center min-h-[90px] touch-manipulation">
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {formData.bannerImgUrl ? (
                <div className="relative w-full flex items-center justify-center">
                  <img
                    crossOrigin="anonymous"
                    src={formData.bannerImgUrl}
                    alt="Category Banner Preview"
                    className="w-full h-24 object-cover rounded shadow-md"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBannerImage();
                    }}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <CrossIcon className="size-4 text-gray-600 hover:text-gray-800" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500 text-xs py-2">
                  <ImgIcon className="size-8 mb-1" />
                  <span>{t("menuComponents.modals.categoryModal.uploadBanner", "Subir banner para la app móvil (Recomendado: horizontal)")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("menuComponents.modals.categoryModal.color")}
            </label>
            <div className="grid grid-cols-5 gap-y-8">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, color: option.value })
                  }
                  className={`w-16 h-16 cursor-pointer flex items-center justify-center rounded-full border-2 transition-all duration-200 ${getColorClasses(
                    option.value,
                    formData.color === option.value
                  )}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full ${option.color}`}
                  ></div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <CustomButton
              type="button"
              onClick={onClose}
              label={t("menuComponents.modals.categoryModal.cancel")}
              variant="secondary"
            />
            <CustomButton
              type="submit"
              label={
                editingCategory
                  ? t("menuComponents.modals.categoryModal.update")
                  : t("menuComponents.modals.categoryModal.create")
              }
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};
