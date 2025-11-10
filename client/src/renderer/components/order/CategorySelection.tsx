import React from "react";
import { Category } from "@/types/categories";
import { UnifiedCard } from "../ui/UnifiedCard";

interface CategorySelectionProps {
  categories: Category[] | null;
  selectedCategory: Category | null;
  onCategorySelect: (category: Category) => void;
  isLoading?: boolean;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Categories</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No categories available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Categories</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`transform transition-all duration-200 ${
              selectedCategory?.id === category.id ? "scale-105" : ""
            }`}
          >
            <UnifiedCard
              data={{
                id: category.id,
                name: category.categoryName,
                color: category.color,
                itemCount: category.itemCount || 0,
                imgUrl: category.imgUrl,
              }}
              type="category"
              onClick={() => onCategorySelect(category)}
              onEdit={() => {}}
              showActions={false}
            />
            {selectedCategory?.id === category.id && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center z-10">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySelection;
