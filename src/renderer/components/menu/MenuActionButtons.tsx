import React from "react";
import AddIcon from "../../assets/icons/add.svg?react";
import { ActionButtonsProps } from "@/types/Menu";

const ACTION_BUTTONS_CONFIG = {
  categories: {
    primary: { label: "CREATE CATEGORY", action: "onCreateCategory" },
    secondary: { label: "CREATE MENU", action: "onCreateMenu" },
  },
  subcategories: {
    primary: { label: "CREATE SUBCATEGORY", action: "onCreateSubcategory" },
    secondary: { label: "CREATE MENU", action: "onCreateMenu" },
  },
  products: {
    primary: { label: "CREATE PRODUCT", action: "onCreateProduct" },
    secondary: { label: "CREATE MENU", action: "onCreateMenu" },
  },
};

export const MenuActionButtons: React.FC<ActionButtonsProps> = ({
  currentLevel,
  onCreateCategory,
  onCreateSubcategory,
  onCreateProduct,
  onCreateMenu,
}) => {
  const config = ACTION_BUTTONS_CONFIG[currentLevel];

  const actionMap = {
    onCreateCategory,
    onCreateSubcategory,
    onCreateProduct,
    onCreateMenu,
  };

  const primaryAction =
    actionMap[config.primary.action as keyof typeof actionMap];
  const secondaryAction =
    actionMap[config.secondary.action as keyof typeof actionMap];

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex flex-wrap gap-4">
          <ActionButton
            label={config.primary.label}
            onClick={primaryAction}
            variant="primary"
          />
          <ActionButton
            label={config.secondary.label}
            onClick={secondaryAction}
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
};
interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary";
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onClick,
  variant,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
      variant === "primary"
        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
        : "bg-gray-500 hover:bg-gray-600 text-white"
    }`}
  >
    <AddIcon className="size-5" />
    {label}
  </button>
);
