import React, { useState } from "react";
import { MenuComponent } from "../components/menu/MenuComponent";
import { MenuStructureComponent } from "../components/menu/MenuStructureView";
import { GroupView } from "../components/menu/GroupView";
import { VariantView } from "../components/menu/VariantView";

export const MenuView: React.FC<{ token: string }> = ({ token }) => {
  const [currentView, setCurrentView] = useState<
    "menu" | "menu-structure" | "group" | "variant"
  >("menu");

  return (
    <div className="min-h-screen">
      <div className="max-w-[98%] mx-auto">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-0">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {currentView === "menu"
                  ? "Menus"
                  : currentView === "menu-structure"
                    ? "Menu Structure"
                    : currentView === "group"
                      ? "Groups"
                      : "Variants"}
              </h1>
            </div>

            {/* View Toggle Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentView("menu")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === "menu"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setCurrentView("menu-structure")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === "menu-structure"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Menu Structure
              </button>
              <button
                onClick={() => setCurrentView("group")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === "group"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Groups
              </button>
              <button
                onClick={() => setCurrentView("variant")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === "variant"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Variants
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {currentView === "menu"
                ? "Create and manage categories, subcategories, and products."
                : currentView === "menu-structure"
                  ? "Create menus and menu pages."
                  : currentView === "group"
                    ? "Create and manage menu groups and options."
                    : "Create and manage product variants and options."}
            </p>
          </div>
        </div>

        {/* Conditional Content Based on View */}
        {currentView === "menu" ? (
          <MenuComponent token={token} />
        ) : currentView === "menu-structure" ? (
          <MenuStructureComponent token={token} />
        ) : currentView === "group" ? (
          <GroupView token={token} />
        ) : (
          <VariantView token={token} />
        )}
      </div>
    </div>
  );
};
