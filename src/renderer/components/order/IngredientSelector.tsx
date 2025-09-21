import React, { useState, useEffect } from "react";
import { MenuItem } from "@/types/Menu";

interface IngredientSelectorProps {
  menuItem: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIngredients: string[]) => void;
  editingIngredients?: string[];
}

export const IngredientSelector: React.FC<IngredientSelectorProps> = ({
  menuItem,
  isOpen,
  onClose,
  onConfirm,
  editingIngredients,
}) => {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  useEffect(() => {
    if (menuItem && menuItem.ingredients && menuItem.ingredients.length > 0) {
      if (editingIngredients) {
        // When editing, use the current ingredients
        setSelectedIngredients([...editingIngredients]);
      } else {
        // When adding new, pre-select all ingredients by default
        setSelectedIngredients([...menuItem.ingredients]);
      }
    } else {
      // If no ingredients available, set empty array
      setSelectedIngredients([]);
    }
  }, [menuItem, editingIngredients]);

  // Auto-confirm if no ingredients are available
  useEffect(() => {
    if (
      isOpen &&
      menuItem &&
      (!menuItem.ingredients ||
        menuItem.ingredients.length === 0 ||
        !menuItem.ingredients.some((ing) => ing.trim() !== ""))
    ) {
      // Auto-confirm with empty ingredients if no ingredients are available
      setTimeout(() => {
        onConfirm([]);
      }, 100); // Small delay to ensure the modal is properly rendered
    }
  }, [isOpen, menuItem, onConfirm]);

  const handleIngredientToggle = (ingredient: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ingredient)) {
        return prev.filter((ing) => ing !== ingredient);
      } else {
        return [...prev, ingredient];
      }
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedIngredients);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen || !menuItem) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">Customize Ingredients</h3>
              <p className="text-indigo-100 text-sm">{menuItem.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors duration-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20 cursor-pointer"
            >
              <svg
                className="w-5 h-5"
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

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              {editingIngredients
                ? "Edit the ingredients for this item. Uncheck any ingredients you want to remove."
                : "Select the ingredients you want to include. Uncheck any ingredients you want to remove."}
            </p>

            {menuItem.ingredients &&
            menuItem.ingredients.length > 0 &&
            menuItem.ingredients.some((ing) => ing.trim() !== "") ? (
              <div className="space-y-3">
                {menuItem.ingredients
                  .filter((ingredient) => ingredient.trim() !== "") // Filter out empty ingredients
                  .map((ingredient, index) => (
                    <label
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIngredients.includes(ingredient)}
                        onChange={() => handleIngredientToggle(ingredient)}
                        className="w-4 h-4 accent-indigo-600 bg-gray-100 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {ingredient}
                      </span>
                    </label>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>No ingredients available for this item</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 cursor-pointer"
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {editingIngredients ? "Update Item" : "Add Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
