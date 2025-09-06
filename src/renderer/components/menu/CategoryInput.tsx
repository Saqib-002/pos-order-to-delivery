import React from "react";
import { CustomSelect } from "../ui/CustomSelect";
import { CategoryInputProps } from "./ModalTypes";

export const CategoryInput: React.FC<CategoryInputProps> = ({
  customCategory,
  onCustomCategoryChange,
  showCustomCategoryInput,
  onShowCustomCategoryInput,
  isDuplicateCategory,
  onDuplicateCategoryChange,
  selectedCategory,
  onCategoryChange,
  categories,
  getCategoryLabel,
}) => {
  const getCategoryOptions = () => {
    const dynamicOptions = categories.map((category) => ({
      value: category,
      label: getCategoryLabel(category),
    }));

    return [
      ...dynamicOptions,
      { value: "custom", label: "+ Add Custom Category" },
    ];
  };

  const handleCategoryChange = (value: string) => {
    if (value === "custom") {
      onShowCustomCategoryInput(true);
      onCategoryChange("");
      onDuplicateCategoryChange(false);
    } else {
      onShowCustomCategoryInput(false);
      onCategoryChange(value);
      onDuplicateCategoryChange(false);
    }
  };

  const handleCustomCategoryChange = (value: string) => {
    onCustomCategoryChange(value);
    const trimmedValue = value.toLowerCase().trim();

    // Check if category already exists
    if (trimmedValue && categories.includes(trimmedValue)) {
      onDuplicateCategoryChange(true);
      onCategoryChange("");
      return;
    }

    onDuplicateCategoryChange(false);
    onCategoryChange(trimmedValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Category *
      </label>
      {!showCustomCategoryInput ? (
        <CustomSelect
          options={getCategoryOptions()}
          value={selectedCategory}
          onChange={handleCategoryChange}
          placeholder="Select category"
          portalClassName="category-dropdown-portal"
        />
      ) : (
        <>
          <div className="relative">
            <input
              type="text"
              value={customCategory}
              onChange={(e) => handleCustomCategoryChange(e.target.value)}
              className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-1 ${
                isDuplicateCategory
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
                  : "border-gray-300 focus:ring-indigo-600 focus:border-indigo-600"
              }`}
              placeholder="Enter new category name"
            />
            <button
              type="button"
              onClick={() => {
                onShowCustomCategoryInput(false);
                onCustomCategoryChange("");
                onCategoryChange("");
                onDuplicateCategoryChange(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
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
          {isDuplicateCategory && (
            <p className="mt-1 text-sm text-red-600">
              This category already exists. Please choose a different name.
            </p>
          )}
        </>
      )}
    </div>
  );
};
