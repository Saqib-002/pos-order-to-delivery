import React from "react";
import AddIcon from "../../public/icons/add.svg?react";
import { ActionButtonsProps } from "@/types/Menu";
import CustomButton from "../ui/CustomButton";

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
          <CustomButton Icon={<AddIcon className="size-6"/>} type="button" onClick={primaryAction} label={config.primary.label} variant="yellow"/>
          <CustomButton Icon={<AddIcon className="size-6"/>} type="button" onClick={secondaryAction} label={config.secondary.label} variant="yellow"/>
        </div>
      </div>
    </div>
  );
};