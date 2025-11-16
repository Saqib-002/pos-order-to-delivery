import React from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import { useTranslation } from "react-i18next";

interface Menu {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: "menu";
}

interface MenuGridProps {
  menus: Menu[] | null;
  onMenuSelect: (menu: Menu) => void;
  isLoading: boolean;
}

const MenuGrid: React.FC<MenuGridProps> = ({
  menus,
  onMenuSelect,
  isLoading,
}) => {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!menus || menus.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-black mb-2">{t("menuComponents.menus.noMenus")}</h3>
        <p className="text-gray-500">{t("menuComponents.menus.noMenusInSubcategory")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {menus.map((menu) => (
        <div
          key={menu.id}
          onClick={() => onMenuSelect(menu)}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-gray-600 transition-colors">
              {menu.name}
            </h3>
            <div className="text-sm font-medium text-gray-600">
              €{menu.price.toFixed(2)}
            </div>
          </div>
          {menu.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {menu.description}
            </p>
          )}
          <div className="mt-3 flex items-center text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {t("menuComponents.menus.clickToViewMenuPages")}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuGrid;
