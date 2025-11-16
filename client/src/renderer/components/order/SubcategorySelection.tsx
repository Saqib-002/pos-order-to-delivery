import React from "react";
import { SubCategory } from "@/types/categories";
import { UnifiedCard } from "../ui/UnifiedCard";
import { useTranslation } from "react-i18next";

interface SubcategorySelectionProps {
  subcategories: SubCategory[] | null;
  selectedSubcategory: SubCategory | null;
  onSubcategorySelect: (subcategory: SubCategory) => void;
  isLoading?: boolean;
  cardLayout?: "row";
}

const SubcategorySelection: React.FC<SubcategorySelectionProps> = ({
  subcategories,
  selectedSubcategory,
  onSubcategorySelect,
  cardLayout,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {t("menuComponents.subcategories.title")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-10 w-24 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!subcategories || subcategories.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {t("menuComponents.subcategories.title")}
        </h3>
        <div className="text-center py-4 text-gray-500">
          <p>{t("menuComponents.subcategories.noSubcategories")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        {t("menuComponents.subcategories.title")}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {subcategories.map((subcategory) => (
          <div
            key={subcategory.id}
            className={`transform transition-all duration-200 hover:scale-105 ${
              selectedSubcategory?.id === subcategory.id ? "scale-105" : ""
            }`}
          >
            <UnifiedCard
              data={{
                id: subcategory.id,
                name: subcategory.name,
                color: subcategory.color,
                itemCount: subcategory.itemCount || 0,
                menuCount: subcategory.menuCount || 0,
                imgUrl: subcategory.imgUrl,
              }}
              type="subcategory"
              onClick={() => onSubcategorySelect(subcategory)}
              onEdit={() => {}}
              showActions={false}
              layout={cardLayout}
            />
            {selectedSubcategory?.id === subcategory.id && (
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

export default SubcategorySelection;
