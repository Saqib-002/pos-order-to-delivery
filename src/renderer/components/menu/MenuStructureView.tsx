import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MenuPageModal } from "./modals/MenuPageModal";
import { MenuModal } from "./modals/MenuModal";
import { UnifiedCard } from "../ui/UnifiedCard";
import NoMenuIcon from "../../assets/icons/no-menu.svg?react";
import NoMenuPageIcon from "../../assets/icons/no-menu-page.svg?react";
import { MenuPageProduct } from "@/types/menuPages";
import CustomButton from "../ui/CustomButton";


interface MenuPage {
  id: string;
  name: string;
  description: string;
  products: Omit<MenuPageProduct, "menuPageId"|"createdAt"| "updatedAt">[];
  itemCount?:number;
  createdAt?: string;
  updatedAt?: string;
}

interface MenuPageAssociation {
  id: string;
  menuPageId: string;
  pageName: string;
  minimum: number;
  maximum: number;
  priority: number;
  kitchenPriority: string;
  multiple: string;
}

interface Menu {
  id: string;
  name: string;
  subcategoryId: string;
  description: string;
  price: number;
  priority: number;
  tax: number;
  discount: number;
  outstanding: boolean;
  menuPageAssociations: MenuPageAssociation[];
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
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuPage, setEditingMenuPage] = useState<MenuPage | null>(null);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  // Fetch data from API
  useEffect(() => {
    fetchMenuPages();
    fetchMenus();
  }, []);
  const fetchMenuPages = async () => {
    try {
      const res = await (window as any).electronAPI.getMenuPages(token);
      if (!res.status) {
        toast.error("Unable to get menu pages");
        return;
      }
      setMenuPages(res.data);
    } catch (error) {
      toast.error("Failed to fetch menu pages");
    }
  };

  const fetchMenus = async () => {
    try {
      const res = await (window as any).electronAPI.getMenus(token);
      if (!res.status) {
        toast.error("Unable to get menus");
        return;
      }
      setMenus(res.data);
    } catch (error) {
      toast.error("Failed to fetch menus");
    }
  };

  const handleCreateMenuPage = () => {
    setEditingMenuPage(null);
    setIsMenuPageModalOpen(true);
  };

  const handleCreateMenu = () => {
    setEditingMenu(null);
    setIsMenuModalOpen(true);
  };

  const handleEditMenuPage = (menuPage: MenuPage) => {
    setEditingMenuPage(menuPage);
    setIsMenuPageModalOpen(true);
  };

  const handleEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
    setIsMenuModalOpen(true);
  };

  const handleDeleteMenuPage = async (menuPage: MenuPage) => {
    if (window.confirm(`Are you sure you want to delete "${menuPage.name}"?`)) {
      try {
        const res = await (window as any).electronAPI.deleteMenuPage(
          token,
          menuPage.id
        );
        if (!res.status) {
          toast.error("Failed to delete menu page");
          return;
        }
        toast.success("Menu page deleted successfully");
        fetchMenuPages(); // Refresh data
      } catch (error) {
        toast.error("Failed to delete menu page");
      }
    }
  };

  const handleDeleteMenu = async (menu: Menu) => {
    if (window.confirm(`Are you sure you want to delete "${menu.name}"?`)) {
      try {
        const res = await (window as any).electronAPI.deleteMenu(
          token,
          menu.id
        );
        if (!res.status) {
          toast.error("Failed to delete menu");
          return;
        }
        toast.success("Menu deleted successfully");
        fetchMenus(); // Refresh data
      } catch (error) {
        toast.error("Failed to delete menu");
      }
    }
  };

  const handleMenuPageSuccess = () => {
    setIsMenuPageModalOpen(false);
    setEditingMenuPage(null);
    fetchMenuPages(); // Refresh data
  };

  const handleMenuSuccess = () => {
    setIsMenuModalOpen(false);
    setEditingMenu(null);
    fetchMenus(); // Refresh data
  };
  return (
    <>
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <CustomButton type="button" onClick={handleCreateMenuPage} label="Create Menu Page" variant="orange"/>
          <CustomButton type="button" onClick={handleCreateMenu} label="Create Menu" variant="orange"/>
        </div>

      {/* Menu Pages Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Menu pages</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuPages.length > 0 ? (
            menuPages.map((page) => (
              <UnifiedCard
                key={page.id}
                data={{
                  id: page.id,
                  name: page.name,
                  description: page.description,
                  itemCount: page.itemCount || 0,
                  color: "blue", // Default color for menu pages
                }}
                type="menuPage"
                onEdit={() => handleEditMenuPage(page)}
                onDelete={() => handleDeleteMenuPage(page)}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-0">
                <NoMenuPageIcon />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-0">
                No Menu Pages
              </h3>
              <p className="text-gray-500 mb-0">
                Get started by creating your first menu page.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Menus Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Menus</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menus.length > 0 ? (
            menus.map((menu) => (
              <UnifiedCard
                key={menu.id}
                data={{
                  id: menu.id,
                  name: menu.name,
                  description: menu.description,
                  price: menu.price,
                  isAvailable: !menu.outstanding, // Assuming outstanding means not available
                  color: "orange", // Default color for menus
                }}
                type="menu"
                onEdit={() => handleEditMenu(menu)}
                onDelete={() => handleDeleteMenu(menu)}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-0">
                <NoMenuIcon />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-0">
                No Menus
              </h3>
              <p className="text-gray-500 mb-0">
                Get started by creating your first menu.
              </p>
            </div>
          )}
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

      {/* Menu Modal */}
      <MenuModal
        isOpen={isMenuModalOpen}
        onClose={() => {
          setIsMenuModalOpen(false);
          setEditingMenu(null);
        }}
        onSuccess={handleMenuSuccess}
        editingMenu={editingMenu}
        token={token}
      />
    </>
  );
};
