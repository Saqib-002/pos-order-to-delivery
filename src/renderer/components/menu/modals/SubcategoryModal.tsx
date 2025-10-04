import { colorOptions } from "@/renderer/utils/utils";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CustomSelect } from "../../ui/CustomSelect";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";

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
  const [formData, setFormData] = useState({
    name: "",
    color: "red",
    categoryId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Get category options for CustomSelect
  const getCategoryOptions = () => {
    return [
      { value: "", label: "Select a category" },
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
      });
    } else {
      setFormData({
        name: "",
        color: "red",
        categoryId: categories.length > 0 ? categories[0].id : "",
      });
    }
  }, [editingSubcategory, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a subcategory name");
      return;
    }

    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    setIsSubmitting(true);

    try {
      let res;
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
            ? "Failed to edit subcategory"
            : "Failed to save subcategory"
        );
        return;
      }
      toast.success(
        editingSubcategory
          ? "Subcategory updated successfully"
          : "Subcategory created successfully"
      );
      onSuccess();
    } catch (error) {
      toast.error("Failed to save subcategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingSubcategory ? "Edit Subcategory" : "Create New Subcategory"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <CustomInput
            label="Subcategory Name"
            name="name"
            type="text"
            placeholder="Enter subcategory name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            otherClasses="mb-4"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Category
            </label>
            <CustomSelect
              options={getCategoryOptions()}
              value={formData.categoryId}
              onChange={(value: string) =>
                setFormData({ ...formData, categoryId: value })
              }
              placeholder="Select a category"
              portalClassName="subcategory-category-dropdown-portal"
            />
          </div>

          <div className="mb-6">
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
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <CustomButton
              type="button"
              onClick={onClose}
              label="Cancel"
              variant="secondary"
            />
            <CustomButton
              type="submit"
              label={editingSubcategory ? "Update" : "Create"}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};
