import { colorOptions } from "@/renderer/utils/utils";
import React, { useState, useEffect, useRef } from "react"; // Import useRef
import { toast } from "react-toastify";
import { CustomSelect } from "../../ui/CustomSelect";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { CrossIcon, ImgIcon } from "@/renderer/public/Svg"; // Import icons
import { useTranslation } from "react-i18next";

interface Category {
  id: string;
  name: string;
  itemCount?: number;
  color: string;
  type: "category" | "subcategory";
}

interface Subcategory {
  id: string;
  name: string;
  itemCount: number;
  color: string;
  categoryId: string;
  imgUrl?: string; // Add this
}

interface SubcategoryModalProps {
  isOpen: boolean;
  token: string | null;
  onClose: () => void;
  onSuccess: () => void;
  editingSubcategory?: Subcategory | null;
  categories: Category[];
}

export const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingSubcategory,
  categories,
  token,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    color: "red",
    categoryId: "",
    imgUrl: "", // Add this
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Add ref for file input

  // Get color classes for selection ring
  const getColorClasses = (color: string, isSelected: boolean) => {
    // ... (no change in this function)
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

  // Get category options for CustomSelect
  const getCategoryOptions = () => {
    // ... (no change in this function)
    return [
      {
        value: "",
        label: t("menuComponents.modals.subcategoryModal.selectCategory"),
      },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ];
  };

  useEffect(() => {
    if (editingSubcategory) {
      setFormData({
        name: editingSubcategory.name,
        color: editingSubcategory.color,
        categoryId: editingSubcategory.categoryId,
        imgUrl: editingSubcategory.imgUrl || "", // Set imgUrl
      });
    } else {
      setFormData({
        name: "",
        color: "red",
        categoryId: "",
        imgUrl: "", // Reset imgUrl
      });
    }
  }, [editingSubcategory, categories, isOpen]);

  // Add image handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, imgUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imgUrl: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(
        t("menuComponents.modals.subcategoryModal.errors.nameRequired")
      );
      return;
    }

    if (!formData.categoryId) {
      toast.error(
        t("menuComponents.modals.subcategoryModal.errors.categoryRequired")
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let res;
      // formData now includes imgUrl, so it will be passed automatically
      if (editingSubcategory) {
        res = await (window as any).electronAPI.updateSubcategory(
          token,
          editingSubcategory.id,
          formData
        );
      } else {
        res = await (window as any).electronAPI.createSubcategory(
          token,
          formData
        );
      }
      if (!res.status) {
        toast.error(
          editingSubcategory
            ? t("menuComponents.modals.subcategoryModal.errors.failedToEdit")
            : t("menuComponents.modals.subcategoryModal.errors.failedToSave")
        );
        return;
      }
      toast.success(
        editingSubcategory
          ? t("menuComponents.modals.subcategoryModal.success.updated")
          : t("menuComponents.modals.subcategoryModal.success.created")
      );
      onSuccess();
    } catch (error) {
      toast.error(
        t("menuComponents.modals.subcategoryModal.errors.failedToSave")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">
            {editingSubcategory
              ? t("menuComponents.modals.subcategoryModal.editTitle")
              : t("menuComponents.modals.subcategoryModal.title")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Wrap name and image in a flex container */}
          <div className="flex items-start gap-4 mb-4">
            <CustomInput
              label={t(
                "menuComponents.modals.subcategoryModal.subcategoryName"
              )}
              name="name"
              type="text"
              placeholder={t(
                "menuComponents.modals.subcategoryModal.enterSubcategoryName"
              )}
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              otherClasses="flex-1" // Use flex-1
            />

            {/* Image Upload */}
            <div className="w-32 flex-shrink-0">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("menuComponents.modals.subcategoryModal.image")}
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-1 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100  flex items-center justify-center touch-manipulation">
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
                        alt="Subcategory Preview"
                        className="size-9 object-cover rounded shadow-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering file input
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

          <div className="mb-4">
            {/* ... (Parent Category select remains the same) ... */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("menuComponents.modals.subcategoryModal.parentCategory")}
            </label>
            <CustomSelect
              options={getCategoryOptions()}
              value={formData.categoryId}
              onChange={(value: string) =>
                setFormData({ ...formData, categoryId: value })
              }
              placeholder={t(
                "menuComponents.modals.subcategoryModal.selectCategory"
              )}
              portalClassName="subcategory-category-dropdown-portal"
            />
          </div>

          <div className="mb-6">
            {/* ... (color picker code remains the same) ... */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("menuComponents.modals.subcategoryModal.color")}
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
            {/* ... (buttons remain the same) ... */}
            <CustomButton
              type="button"
              onClick={onClose}
              label={t("menuComponents.modals.subcategoryModal.cancel")}
              variant="secondary"
            />
            <CustomButton
              type="submit"
              label={
                editingSubcategory
                  ? t("menuComponents.modals.subcategoryModal.update")
                  : t("menuComponents.modals.subcategoryModal.create")
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
