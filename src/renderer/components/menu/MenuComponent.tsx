import React, { useState, useEffect } from "react";

import { CategoryModal } from "./modals/CategoryModal";
import { SubcategoryModal } from "./modals/SubcategoryModal";
import { ProductModal } from "./modals/ProductModal";
import { MenuModal } from "./modals/MenuModal";
import { MenuActionButtons } from "./MenuActionButtons";
import { MenuBreadcrumb } from "./MenuBreadCrumb";
import { MenuContentSections } from "./MenuContentSections";

import {
  Category,
  Subcategory,
  Product,
  MenuComponentProps,
} from "@/types/Menu";
import { fetchCategories, fetchProducts, fetchSubcategories } from "@/renderer/utils/menu";

type NavigationLevel = "categories" | "subcategories" | "products";

export const MenuComponent: React.FC<MenuComponentProps> = ({ token }) => {
  // State for data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // State for modals
  const [modals, setModals] = useState({
    category: false,
    subcategory: false,
    product: false,
    menu: false,
  });

  // State for editing
  const [editing, setEditing] = useState({
    category: null as Category | null,
    subcategory: null as Subcategory | null,
    product: null as Product | null,
  });

  // Navigation state
  const [navigation, setNavigation] = useState({
    currentLevel: "categories" as NavigationLevel,
    selectedCategory: null as Category | null,
    selectedSubcategory: null as Subcategory | null,
  });

  

  // Initialize data
  useEffect(() => {
    fetchCategories(token, setCategories);
    fetchProducts(token,setProducts);
  }, [token]);
  // Modal control functions
  const openModal = (type: keyof typeof modals, editItem?: any) => {
    setModals((prev) => ({ ...prev, [type]: true }));
    if (editItem) {
      setEditing((prev) => ({ ...prev, [type]: editItem }));
    }
  };

  const closeModal = (type: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [type]: false }));
    setEditing((prev) => ({ ...prev, [type]: null }));
  };

  // Navigation functions
  const handleCategoryClick = (category: Category) => {
    setNavigation({
      currentLevel: "subcategories",
      selectedCategory: category,
      selectedSubcategory: null,
    });
    fetchSubcategories(category.id,token,setSubcategories);
  };

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    setNavigation((prev) => ({
      ...prev,
      currentLevel: "products",
      selectedSubcategory: subcategory,
    }));
  };

  const handleBackToCategories = () => {
    setNavigation({
      currentLevel: "categories",
      selectedCategory: null,
      selectedSubcategory: null,
    });
    setSubcategories([]);
  };

  const handleBackToSubcategories = () => {
    setNavigation((prev) => ({
      ...prev,
      currentLevel: "subcategories",
      selectedSubcategory: null,
    }));
  };

  // Success handlers
  const handleCategorySuccess = () => {
    closeModal("category");
    fetchCategories(token,setCategories);
  };

  const handleSubcategorySuccess = () => {
    closeModal("subcategory");
    if (navigation.selectedCategory) {
      fetchSubcategories(navigation.selectedCategory.id,token,setSubcategories);
    }
  };

  const handleProductSuccess = () => {
    closeModal("product");
    fetchProducts(token,setProducts);
  };

  const handleMenuSuccess = () => {
    closeModal("menu");
  };

  // Delete handler
  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      // TODO: Call API to delete product
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <MenuActionButtons
        currentLevel={navigation.currentLevel}
        onCreateCategory={() => openModal("category")}
        onCreateSubcategory={() => openModal("subcategory")}
        onCreateProduct={() => openModal("product")}
        onCreateMenu={() => openModal("menu")}
      />

      {/* Breadcrumb Navigation */}
      <MenuBreadcrumb
        currentLevel={navigation.currentLevel}
        selectedCategory={navigation.selectedCategory}
        selectedSubcategory={navigation.selectedSubcategory}
        onBackToCategories={handleBackToCategories}
        onBackToSubcategories={handleBackToSubcategories}
      />

      {/* Content Sections */}
      <MenuContentSections
        currentLevel={navigation.currentLevel}
        categories={categories}
        subcategories={subcategories}
        products={products}
        selectedCategory={navigation.selectedCategory}
        selectedSubcategory={navigation.selectedSubcategory}
        onCategoryClick={handleCategoryClick}
        onSubcategoryClick={handleSubcategoryClick}
        onEditCategory={(category) => openModal("category", category)}
        onEditSubcategory={(subcategory) =>
          openModal("subcategory", subcategory)
        }
        onEditProduct={(product) => openModal("product", product)}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Modals */}
      <CategoryModal
        isOpen={modals.category}
        token={token}
        onClose={() => closeModal("category")}
        onSuccess={handleCategorySuccess}
        editingCategory={editing.category}
      />

      <SubcategoryModal
        isOpen={modals.subcategory}
        token={token}
        onClose={() => closeModal("subcategory")}
        onSuccess={handleSubcategorySuccess}
        editingSubcategory={editing.subcategory}
        categories={categories}
      />

      <ProductModal
        token={token}
        isOpen={modals.product}
        onClose={() => {
          closeModal("product");
          setSubcategories([]); // Clear subcategories when modal closes
        }}
        onSuccess={handleProductSuccess}
        product={editing.product}
        categories={categories}
        subcategories={subcategories}
        onFetchSubcategories={(id)=>fetchSubcategories(id,token,setSubcategories)}
        onClearSubcategories={() => setSubcategories([])}
      />

      <MenuModal
        isOpen={modals.menu}
        onClose={() => closeModal("menu")}
        onSuccess={handleMenuSuccess}
        editingMenu={null}
        token={token}
      />
    </>
  );
};
