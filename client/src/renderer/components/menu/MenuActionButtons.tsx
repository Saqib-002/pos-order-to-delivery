import React from "react";
import AddIcon from "../../public/icons/add.svg?react";
import { ActionButtonsProps } from "@/types/Menu";
import CustomButton from "../ui/CustomButton";
import { useTranslation } from "react-i18next";

const ACTION_BUTTONS_CONFIG = {
  categories: {
    primary: { labelKey: "menuComponents.categories.addCategory", action: "onCreateCategory" },
    secondary: { labelKey: "menuComponents.menus.addMenu", action: "onCreateMenu" },
  },
  subcategories: {
    primary: { labelKey: "menuComponents.subcategories.addSubcategory", action: "onCreateSubcategory" },
    secondary: { labelKey: "menuComponents.menus.addMenu", action: "onCreateMenu" },
  },
  products: {
    primary: { labelKey: "menuComponents.products.addProduct", action: "onCreateProduct" },
    secondary: { labelKey: "menuComponents.menus.addMenu", action: "onCreateMenu" },
  },
};

export const MenuActionButtons: React.FC<ActionButtonsProps> = ({
  currentLevel,
  onCreateCategory,
  onCreateSubcategory,
  onCreateProduct,
  onCreateMenu,
}) => {
  const { t } = useTranslation();
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
          <CustomButton Icon={<AddIcon className="size-6"/>} type="button" onClick={primaryAction} label={t(config.primary.labelKey)} variant="yellow"/>
          <CustomButton Icon={<AddIcon className="size-6"/>} type="button" onClick={secondaryAction} label={t(config.secondary.labelKey)} variant="yellow"/>
        </div>
      </div>
    </div>
  );
};