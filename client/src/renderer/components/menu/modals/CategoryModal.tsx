import { colorOptions } from "@/renderer/utils/utils";
import React, { useState, useEffect, useRef } from "react"; // Import useRef
import { toast } from "react-toastify";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { CrossIcon, ImgIcon } from "@/renderer/public/Svg"; // Import icons

interface Category {
  id: string;
  name: string;
  itemCount?: number;
  color: string;
  type: "category" | "subcategory";
  imgUrl?: string; // Add this
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
  const [formData, setFormData] = useState({
    name: "",
    color: "red",
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
  console.log(editingCategory)
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        color: editingCategory.color,
        imgUrl: editingCategory.imgUrl || "", // Set imgUrl
      });
    } else {
      setFormData({
        name: "",
        color: "red",
        imgUrl: "", // Reset imgUrl
      });
    }
  }, [editingCategory, isOpen]);

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
      toast.error("Please enter a category name");
      return;
    }

    setIsSubmitting(true);

    try {
      let res;
      // Pass imgUrl to the API calls
      if (editingCategory) {
        res = await (window as any).electronAPI.updateCategory(
          token,
          editingCategory.id,
          {
            categoryName: formData.name,
            color: formData.color,
            imgUrl: formData.imgUrl,
          }
        );
      } else {
        res = await (window as any).electronAPI.createCategory(token, {
          categoryName: formData.name,
          color: formData.color,
          imgUrl: formData.imgUrl,
        });
      }
      if (!res.status) {
        toast.error(
          editingCategory
            ? "Failed to edit category"
            : "Failed to save category"
        );
        return;
      }
      toast.success(
        editingCategory
          ? "Category updated successfully"
          : "Category created successfully"
      );
      onSuccess();
    } catch (error) {
      toast.error("Failed to save category");
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
            {editingCategory ? "Edit Category" : "Create New Category"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Wrap name and image in a flex container */}
          <div className="flex items-start gap-4 mb-4">
            <CustomInput
              label="Category Name"
              name="categoryName"
              type="text"
              value={formData.name} // Add value prop
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Enter category name"
              otherClasses="flex-1" // Use flex-1
            />

            {/* Image Upload */}
            <div className="w-32 flex-shrink-0">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                IMAGE
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
                        alt="Category Preview"
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

          <div className="mb-6">
            {/* ... (color picker code remains the same) ... */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
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
                  {/* <span className="text-xs text-gray-700">{option.label}</span> */}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {/* ... (buttons remain the same) ... */}
            <CustomButton
              type="button"
              onClick={onClose}
              label="Cancel"
              variant="secondary"
            />
            <CustomButton
              type="submit"
              label={editingCategory ? "Update" : "Create"}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};