import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CustomSelect } from "../../ui/CustomSelect";
import { CategoryInput } from "../CategoryInput";
import { MenuItemModalProps } from "../ModalTypes";

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  token,
  categories,
  onSuccess,
  editingItem,
}) => {
  const isEditMode = !!editingItem;

  const [item, setItem] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    isAvailable: true,
    ingredients: [] as string[],
  });

  const [newIngredient, setNewIngredient] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [isDuplicateCategory, setIsDuplicateCategory] = useState(false);

  // Initialize form when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setItem({
        name: editingItem.name,
        description: editingItem.description || "",
        price: editingItem.price,
        category: editingItem.category,
        isAvailable: editingItem.isAvailable,
        ingredients: editingItem.ingredients || [],
      });
      setCustomCategory(editingItem.category);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getStatusOptions = () => [
    { value: "available", label: "Available" },
    { value: "unavailable", label: "Unavailable" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!item.name.trim()) {
      toast.error("Please enter a menu item name");
      return;
    }
    if (!item.category) {
      toast.error("Please select a category");
      return;
    }
    if (item.price <= 0) {
      toast.error("Please enter a valid price greater than 0");
      return;
    }
    // Check if custom category already exists
    if (showCustomCategoryInput && categories.includes(item.category)) {
      toast.error("Category already exists. Please choose a different name.");
      return;
    }

    try {
      let res;
      if (isEditMode && editingItem) {
        res = await (window as any).electronAPI.updateMenuItem(
          token,
          editingItem.id,
          item
        );
      } else {
        res = await (window as any).electronAPI.createMenuItem(token, item);
      }

      if (!res.status) {
        toast.error(
          res.error.includes("UNIQUE constraint failed: menu_items.name")
            ? "Menu item already exists"
            : `Failed to ${isEditMode ? "update" : "add"} menu item`
        );
        return;
      }

      onSuccess();
      resetForm();
      onClose();
      toast.success(
        `Menu item ${isEditMode ? "updated" : "added"} successfully`
      );
    } catch (error) {
      toast.error(`Failed to ${isEditMode ? "update" : "add"} menu item`);
    }
  };

  const resetForm = () => {
    setItem({
      name: "",
      description: "",
      price: 0,
      category: "",
      isAvailable: true,
      ingredients: [],
    });
    setNewIngredient("");
    setCustomCategory("");
    setShowCustomCategoryInput(false);
    setIsDuplicateCategory(false);
  };

  const addIngredient = (ingredient: string) => {
    const cleanIngredient = ingredient.trim();
    // Check for special characters (only allow letters, numbers, spaces, and basic punctuation)
    const specialCharRegex = /[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/;

    if (
      cleanIngredient &&
      !specialCharRegex.test(cleanIngredient) &&
      !item.ingredients.includes(cleanIngredient)
    ) {
      setItem({
        ...item,
        ingredients: [...item.ingredients, cleanIngredient],
      });
      setNewIngredient("");
    } else if (specialCharRegex.test(cleanIngredient)) {
      toast.error(
        "Ingredients cannot contain special characters like !@#$%^&*()_+=[]{};':\"\\|,.<>/?"
      );
    }
  };

  const removeIngredient = (index: number) => {
    setItem({
      ...item,
      ingredients: item.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {isEditMode ? "Edit Menu Item" : "Add New Menu Item"}
            </h3>
            <button
              onClick={handleClose}
              className="text-white hover:text-indigo-500 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => setItem({ ...item, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                placeholder="Item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={item.price}
                onChange={(e) =>
                  setItem({
                    ...item,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                placeholder="0.00"
              />
            </div>
            <CategoryInput
              customCategory={customCategory}
              onCustomCategoryChange={setCustomCategory}
              showCustomCategoryInput={showCustomCategoryInput}
              onShowCustomCategoryInput={setShowCustomCategoryInput}
              isDuplicateCategory={isDuplicateCategory}
              onDuplicateCategoryChange={setIsDuplicateCategory}
              selectedCategory={item.category}
              onCategoryChange={(value) =>
                setItem({ ...item, category: value })
              }
              categories={categories}
              getCategoryLabel={getCategoryLabel}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <CustomSelect
                options={getStatusOptions()}
                value={item.isAvailable ? "available" : "unavailable"}
                onChange={(value: string) =>
                  setItem({
                    ...item,
                    isAvailable: value === "available",
                  })
                }
                placeholder="Select status"
                portalClassName="menu-item-status-dropdown-portal"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={item.description}
                onChange={(e) =>
                  setItem({ ...item, description: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                rows={3}
                placeholder="Item description"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredients
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIngredient}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow letters, numbers, spaces, and basic punctuation
                      const specialCharRegex =
                        /[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/;
                      if (!specialCharRegex.test(value)) {
                        setNewIngredient(value);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addIngredient(newIngredient);
                      }
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="Add ingredient (press Enter to add)"
                  />
                  <button
                    type="button"
                    onClick={() => addIngredient(newIngredient)}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                  >
                    Add
                  </button>
                </div>
                {item.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.ingredients
                      .filter((ingredient) => ingredient.trim() !== "")
                      .map((ingredient, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                        >
                          {ingredient}
                          <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium cursor-pointer hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 cursor-pointer hover:scale-105"
            >
              {isEditMode ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
