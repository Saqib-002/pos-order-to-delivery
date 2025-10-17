import { BreadcrumbProps } from "@/types/Menu";
import React from "react";

export const MenuBreadcrumb: React.FC<BreadcrumbProps> = ({
  currentLevel,
  selectedCategory,
  selectedSubcategory,
  onBackToCategories,
  onBackToSubcategories,
}) => {
  if (currentLevel === "categories") {
    return null;
  }

  return (
    <div className="flex justify-end">
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <BreadcrumbLink
          label="Categories"
          onClick={onBackToCategories}
          isClickable
        />

        {selectedCategory && (
          <>
            <span className="text-gray-400">/</span>
            {currentLevel === "subcategories" ? (
              <span className="text-black font-medium">
                {selectedCategory.name}
              </span>
            ) : (
              <BreadcrumbLink
                label={selectedCategory.name}
                onClick={onBackToSubcategories}
                isClickable
              />
            )}
          </>
        )}

        {selectedSubcategory && currentLevel === "products" && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-black font-medium">
              {selectedSubcategory.name}
            </span>
          </>
        )}
      </nav>
    </div>
  );
};

interface BreadcrumbLinkProps {
  label: string;
  onClick?: () => void;
  isClickable: boolean;
}

const BreadcrumbLink: React.FC<BreadcrumbLinkProps> = ({
  label,
  onClick,
  isClickable,
}) => (
  <button
    onClick={isClickable ? onClick : undefined}
    className={`transition-colors duration-200 ${
      isClickable ? "hover:text-black cursor-pointer" : "cursor-default"
    }`}
    disabled={!isClickable}
  >
    {label}
  </button>
);
