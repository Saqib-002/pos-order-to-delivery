import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MenuPageModal } from "./modals/MenuPageModal";

interface MenuPageProduct {
  id: string;
  name: string;
  supplement: number;
  priority: number;
}

interface MenuPage {
  id: string;
  name: string;
  description: string;
  products: MenuPageProduct[];
  createdAt?: string;
  updatedAt?: string;
}

interface Menu {
  id: string;
  name: string;
  price: number;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MenuStructureComponentProps {
  token: string;
}

export const MenuStructureComponent: React.FC<MenuStructureComponentProps> = ({
  token,
}) => {
  const [menuPages, setMenuPages] = useState<MenuPage[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isMenuPageModalOpen, setIsMenuPageModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [editingMenuPage, setEditingMenuPage] = useState<MenuPage | null>(null);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Mock data for menu pages
    const mockMenuPages: MenuPage[] = [
      {
        id: "1",
        name: "Drinks",
        description: "Beverages and drinks",
        products: [
          { id: "1", name: "Coca Cola", supplement: 2.5, priority: 1 },
          { id: "2", name: "Water", supplement: 1.0, priority: 2 },
        ],
      },
      {
        id: "2",
        name: "Box Kebab Menu",
        description: "Kebab in a box",
        products: [
          { id: "3", name: "Chicken Kebab", supplement: 0, priority: 1 },
          { id: "4", name: "Lamb Kebab", supplement: 2.0, priority: 2 },
        ],
      },
      {
        id: "3",
        name: "Menu Status",
        description: "Status menu items",
        products: [],
      },
      {
        id: "4",
        name: "Durum Menu",
        description: "Durum wraps",
        products: [
          { id: "5", name: "Chicken Durum", supplement: 0, priority: 1 },
        ],
      },
      {
        id: "5",
        name: "Menu Status Flafel",
        description: "Falafel menu",
        products: [],
      },
      {
        id: "6",
        name: "Big Plate Menu",
        description: "Large portion meals",
        products: [],
      },
      {
        id: "7",
        name: "Hamburger Menu",
        description: "Burger options",
        products: [],
      },
      {
        id: "8",
        name: "Kebab Menu",
        description: "Traditional kebab",
        products: [],
      },
      {
        id: "9",
        name: "Menu Kebab Flafel",
        description: "Kebab and falafel combo",
        products: [],
      },
      {
        id: "10",
        name: "Lahmacum Menu",
        description: "Turkish pizza",
        products: [],
      },
      {
        id: "11",
        name: "Rice And Meat Dish Menu",
        description: "Rice with meat",
        products: [],
      },
      {
        id: "12",
        name: "Menu Plato Falafel",
        description: "Falafel plate",
        products: [],
      },
      {
        id: "13",
        name: "Regular Dish Menu",
        description: "Standard dishes",
        products: [],
      },
      {
        id: "14",
        name: "Potato And Rice Dish Menu",
        description: "Potato and rice combo",
        products: [],
      },
      {
        id: "15",
        name: "Menu Plate French Fries And Meat",
        description: "Fries with meat",
        products: [],
      },
      {
        id: "16",
        name: "Menu Plate Only Meat And Sauce",
        description: "Meat with sauce",
        products: [],
      },
      {
        id: "17",
        name: "2 L Soft Drink",
        description: "Large soft drinks",
        products: [],
      },
    ];

    // Mock data for menus
    const mockMenus: Menu[] = [
      { id: "1", name: "Kebab Menu", price: 7.0, color: "yellow" },
      { id: "2", name: "Durum Menu", price: 7.5, color: "blue" },
      { id: "3", name: "Menu Box kebab", price: 6.5, color: "green" },
      { id: "4", name: "Lahmacun menu", price: 8.0, color: "yellow" },
    ];

    setMenuPages(mockMenuPages);
    setMenus(mockMenus);
  }, []);

  const handleCreateMenuPage = () => {
    setEditingMenuPage(null);
    setIsMenuPageModalOpen(true);
  };

  const handleCreateMenu = () => {
    setEditingMenu(null);
    setIsCreateMenuOpen(true);
  };

  const handleEditMenuPage = (menuPage: MenuPage) => {
    setEditingMenuPage(menuPage);
    setIsMenuPageModalOpen(true);
  };

  const handleEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
    setIsCreateMenuOpen(true);
  };

  const handleDeleteMenuPage = (menuPage: MenuPage) => {
    if (window.confirm(`Are you sure you want to delete "${menuPage.name}"?`)) {
      setMenuPages(menuPages.filter((p) => p.id !== menuPage.id));
      // TODO: Call API to delete menu page
    }
  };

  const handleDeleteMenu = (menu: Menu) => {
    if (window.confirm(`Are you sure you want to delete "${menu.name}"?`)) {
      setMenus(menus.filter((m) => m.id !== menu.id));
      // TODO: Call API to delete menu
    }
  };

  const getMenuColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      yellow: "bg-yellow-100 border-yellow-200",
      blue: "bg-blue-100 border-blue-200",
      green: "bg-green-100 border-green-200",
      red: "bg-red-100 border-red-200",
      purple: "bg-purple-100 border-purple-200",
      orange: "bg-orange-100 border-orange-200",
      pink: "bg-pink-100 border-pink-200",
      indigo: "bg-indigo-100 border-indigo-200",
      gray: "bg-gray-100 border-gray-200",
    };
    return colorMap[color] || "bg-gray-100 border-gray-200";
  };

  const handleMenuPageSuccess = () => {
    setIsMenuPageModalOpen(false);
    setEditingMenuPage(null);
    // Refresh data
  };

  const handleMenuSuccess = () => {
    setIsCreateMenuOpen(false);
    setEditingMenu(null);
    // Refresh data
  };

  return (
    <>
      {/* Action Buttons Section */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={handleCreateMenuPage}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            CREATE PAGES
          </button>
          <button
            onClick={handleCreateMenu}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            CREATE MENUS
          </button>
        </div>
      </div>

      {/* Menu Pages Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Menu pages</h2>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuPages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 text-sm">
                  {page.name}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditMenuPage(page)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMenuPage(page)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menus Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Menus</h2>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className={`bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${getMenuColorClasses(menu.color)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm">
                  {menu.name}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditMenu(menu)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMenu(menu)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                €{menu.price.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 uppercase">MENUS</div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Page Modal */}
      <MenuPageModal
        isOpen={isMenuPageModalOpen}
        onClose={() => {
          setIsMenuPageModalOpen(false);
          setEditingMenuPage(null);
        }}
        onSuccess={handleMenuPageSuccess}
        editingMenuPage={editingMenuPage}
        token={token}
      />
    </>
  );
};
