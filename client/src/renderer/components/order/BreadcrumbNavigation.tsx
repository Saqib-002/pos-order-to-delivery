import React from "react";
import { Category, SubCategory } from "@/types/categories";

interface BreadcrumbNavigationProps {
  selectedCategory: Category | null;
  selectedSubcategory: SubCategory | null;
  onBackToCategories: () => void;
  onBackToSubcategories: () => void;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  selectedCategory,
  selectedSubcategory,
  onBackToCategories,
  onBackToSubcategories,
}) => {
  return (
    <nav className="mb-6">
      <div className="flex items-center space-x-2 text-sm">
        <button
          onClick={onBackToCategories}
          className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Categories
        </button>

        {selectedCategory && (
          <>
            <span className="text-gray-400">›</span>
            <button
              onClick={onBackToSubcategories}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              {selectedCategory.categoryName}
            </button>
          </>
        )}

        {selectedSubcategory && (
          <>
            <span className="text-gray-400">›</span>
            <span className="text-gray-600 font-medium">
              {selectedSubcategory.name}
            </span>
          </>
        )}
      </div>
    </nav>
  );
};

export default BreadcrumbNavigation;
