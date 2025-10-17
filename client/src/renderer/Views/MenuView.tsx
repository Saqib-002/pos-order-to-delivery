import React, { useState, memo } from "react";
import { MenuComponent } from "../components/menu/MenuComponent";
import { MenuStructureComponent } from "../components/menu/MenuStructureView";
import { GroupView } from "../components/menu/GroupView";
import { VariantView } from "../components/menu/VariantView";
import CustomButton from "../components/ui/CustomButton";
const VIEW_CONFIG = {
  menu: {
    title: "Menus",
    description: "Create and manage categories, subcategories, and products.",
  },
  "menu-structure": {
    title: "Menu Structure",
    description: "Create menus and menu pages.",
  },
  group: {
    title: "Groups",
    description: "Create and manage menu groups and options.",
  },
  variant: {
    title: "Variants",
    description: "Create and manage product variants and options.",
  },
} as const;
type ViewKey = keyof typeof VIEW_CONFIG;
const MenuHeader: React.FC<{
  currentView: ViewKey;
  onViewChange: (view: ViewKey) => void;
}> = memo(({ currentView, onViewChange }) => {
  const config = VIEW_CONFIG[currentView];
  const toggleViews: ViewKey[] = ["menu", "menu-structure", "group", "variant"];
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-0">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-black">{config.title}</h1>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {toggleViews.map((view) => (
            <CustomButton
              type="button"
              key={view}
              onClick={() => onViewChange(view)}
              label={
                view.charAt(0).toUpperCase() + view.replace(/-/g, " ").slice(1)
              }
              variant="transparent"
              className={`${
                currentView === view
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-600 hover:text-black"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-gray-600">{config.description}</p>
      </div>
    </div>
  );
});
export const MenuView = memo(() => {
  const [currentView, setCurrentView] = useState<ViewKey>("menu");
  const renderContent = () => {
    switch (currentView) {
      case "menu":
        return <MenuComponent />;
      case "menu-structure":
        return <MenuStructureComponent />;
      case "group":
        return <GroupView />;
      case "variant":
        return <VariantView />;
      default:
        return null;
    }
  };
  return (
    <div className="p-4 flex flex-col">
      <MenuHeader currentView={currentView} onViewChange={setCurrentView} />
      {renderContent()}
    </div>
  );
});
