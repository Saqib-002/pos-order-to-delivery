import React, { useState, useEffect } from "react";
import { UnifiedCard } from "../components/ui/UnifiedCard";
import { GroupView } from "../components/menu/GroupView";
import { VariantView } from "../components/menu/VariantView";
import { CategoryModal } from "../components/menu/CategoryModal";
import { SubcategoryModal } from "../components/menu/SubcategoryModal";
import { ProductModal } from "../components/menu/ProductModal";
import { MenuModal } from "../components/menu/MenuModal";
import { toast } from "react-toastify";

interface Category {
  id: string;
  name: string;
  itemCount?: number;
  color: string;
  type: "category" | "subcategory";
}

interface Subcategory {
  id: string;
  name: string;
  itemCount: number;
  color: string;
  categoryId: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  isAvailable: boolean;
  color: string;
}

export const MenuView: React.FC<{token: string}> = ({token}) => {
  const [currentView, setCurrentView] = useState<"menu" | "group" | "variant">(
    "menu"
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isCreateSubcategoryOpen, setIsCreateSubcategoryOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] =
    useState<Subcategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Navigation state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);
  const [currentLevel, setCurrentLevel] = useState<
    "categories" | "subcategories" | "products"
  >("categories");

  const getCategories=async()=>{
    const res= await (window as any).electronAPI.getCategories(token);
    if(!res.status){
      toast.error("Unable to get categories");
      return;
    }
    setCategories(res.data.map((c: any) => ({ ...c, name: c.categoryName})));
  }
  const getSubcategories=async(id:string)=>{
    const res= await (window as any).electronAPI.getSubcategories(token,id);
    if(!res.status){
      toast.error("Unable to get categories");
      return;
    }
    setSubcategories(res.data);
  }
  // Mock data - replace with actual API calls
  useEffect(() => {
    getCategories();

    const mockProducts = [
      {
        id: "1",
        name: "Caesar Salad",
        description: "Fresh romaine lettuce with caesar dressing",
        price: 12.99,
        categoryId: "1",
        subcategoryId: "2",
        isAvailable: true,
        color: "green",
      },
      {
        id: "2",
        name: "Greek Salad",
        description: "Mixed greens with feta cheese and olives",
        price: 14.99,
        categoryId: "1",
        subcategoryId: "2",
        isAvailable: true,
        color: "green",
      },
      {
        id: "3",
        name: "Margherita Pizza",
        description: "Classic pizza with tomato, mozzarella, and basil",
        price: 16.99,
        categoryId: "2",
        subcategoryId: "4",
        isAvailable: true,
        color: "red",
      },
      {
        id: "4",
        name: "Pepperoni Pizza",
        description: "Pizza topped with pepperoni and cheese",
        price: 18.99,
        categoryId: "2",
        subcategoryId: "4",
        isAvailable: true,
        color: "red",
      },
      {
        id: "5",
        name: "Chicken Pasta",
        description: "Creamy pasta with grilled chicken",
        price: 15.99,
        categoryId: "2",
        subcategoryId: "3",
        isAvailable: true,
        color: "yellow",
      },
      {
        id: "6",
        name: "Tomato Soup",
        description: "Classic tomato soup with herbs",
        price: 8.99,
        categoryId: "1",
        subcategoryId: "1",
        isAvailable: true,
        color: "orange",
      },
    ];

    setProducts(mockProducts);
  }, []);

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsCreateCategoryOpen(true);
  };

  const handleCreateSubcategory = () => {
    setEditingSubcategory(null);
    setIsCreateSubcategoryOpen(true);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleCreateMenu = () => {
    setIsCreateMenuOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCreateCategoryOpen(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setIsCreateSubcategoryOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      setProducts(products.filter((p) => p.id !== product.id));
      // TODO: Call API to delete product
    }
  };

  // Navigation functions
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setCurrentLevel("subcategories");
    getSubcategories(category.id);
  };

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
    setCurrentLevel("products");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setCurrentLevel("categories");
  };

  const handleBackToSubcategories = () => {
    setSelectedSubcategory(null);
    setCurrentLevel("subcategories");
  };


  const getFilteredProducts = () => {
    if (!selectedSubcategory) return [];
    const filtered = products.filter(
      (product) => product.subcategoryId === selectedSubcategory.id
    );
    return filtered;
  };

  const handleCategorySuccess = () => {
    setIsCreateCategoryOpen(false);
    setEditingCategory(null);
    getCategories();
  };

  const handleSubcategorySuccess = () => {
    setIsCreateSubcategoryOpen(false);
    setEditingSubcategory(null);
    getSubcategories(selectedCategory!.id);
  };

  const handleProductSuccess = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    // Refresh data
  };

  const handleMenuSuccess = () => {
    setIsCreateMenuOpen(false);
    // Refresh data
  };

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
                ? "Create menus and menu pages."
                : currentView === "group"
                  ? "Create and manage menu groups and options."
                  : "Create and manage product variants and options."}
            </p>

            {/* Breadcrumb Navigation for Menu Structure */}
            {currentView === "menu" && currentLevel !== "categories" && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <button
                  onClick={handleBackToCategories}
                  className="hover:text-gray-900 transition-colors duration-200"
                >
                  Categories
                </button>
                {currentLevel === "subcategories" && selectedCategory && (
                  <>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">
                      {selectedCategory.name}
                    </span>
                  </>
                )}
                {currentLevel === "products" &&
                  selectedCategory &&
                  selectedSubcategory && (
                    <>
                      <span>/</span>
                      <button
                        onClick={handleBackToSubcategories}
                        className="hover:text-gray-900 transition-colors duration-200"
                      >
                        {selectedCategory.name}
                      </button>
                      <span>/</span>
                      <span className="text-gray-900 font-medium">
                        {selectedSubcategory.name}
                      </span>
                    </>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Conditional Content Based on View */}
        {currentView === "menu" ? (
          <>
            {/* Action Buttons Section */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Main Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  {currentLevel === "categories" && (
                    <button
                      onClick={handleCreateCategory}
                      className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      CREATE CATEGORY
                    </button>
                  )}

                  {currentLevel === "subcategories" && (
                    <button
                      onClick={handleCreateSubcategory}
                      className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      CREATE SUBCATEGORY
                    </button>
                  )}

                  {currentLevel === "products" && (
                    <button
                      onClick={handleCreateProduct}
                      className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      CREATE PRODUCT
                    </button>
                  )}

                  <button
                    onClick={handleCreateMenu}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    CREATE MENU
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Content Based on Current Level */}
            {currentLevel === "categories" && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Categories
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categories.length === 0 && (
                    <div className="flex items-center justify-center">
                      <p className="text-xl text-gray-500">
                        No categories found. Please create a category.
                      </p>
                    </div>
                  )}
                  {categories.map((category) => (
                    <UnifiedCard
                      key={category.id}
                      data={category}
                      type="category"
                      onEdit={() => handleEditCategory(category)}
                      onClick={() => handleCategoryClick(category)}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentLevel === "subcategories" && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Subcategories in {selectedCategory?.name}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {subcategories.length === 0 && (
                    <div className="flex items-center justify-center">
                      <p className="text-xl text-gray-500">
                        No categories found. Please create a category.
                      </p>
                    </div>
                  )}
                  {subcategories.map((subcategory) => (
                    <UnifiedCard
                      key={subcategory.id}
                      data={subcategory}
                      type="subcategory"
                      onEdit={() => handleEditSubcategory(subcategory)}
                      onClick={() => handleSubcategoryClick(subcategory)}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentLevel === "products" && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Products in {selectedSubcategory?.name}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getFilteredProducts().length > 0 ? (
                    getFilteredProducts().map((product) => (
                      <UnifiedCard
                        key={product.id}
                        data={product}
                        type="product"
                        onEdit={() => handleEditProduct(product)}
                        onDelete={() => handleDeleteProduct(product)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">
                        No products found in this subcategory.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : currentView === "group" ? (
          <GroupView token={token}/>
        ) : (
          <VariantView token={token}/>
        )}

        {/* Modals */}
        <CategoryModal
          isOpen={isCreateCategoryOpen}
          token={token}
          onClose={() => {
            setIsCreateCategoryOpen(false);
            setEditingCategory(null);
          }}
          onSuccess={handleCategorySuccess}
          editingCategory={editingCategory}
          />

        <SubcategoryModal
          isOpen={isCreateSubcategoryOpen}
          token={token}
          onClose={() => {
            setIsCreateSubcategoryOpen(false);
            setEditingSubcategory(null);
          }}
          onSuccess={handleSubcategorySuccess}
          editingSubcategory={editingSubcategory}
          categories={categories}
        />

        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={handleProductSuccess}
          product={editingProduct}
          categories={categories}
          subcategories={subcategories}
          isEditMode={!!editingProduct}
        />

        <MenuModal
          isOpen={isCreateMenuOpen}
          onClose={() => setIsCreateMenuOpen(false)}
          onSuccess={handleMenuSuccess}
        />
      </div>
    </div>
  );
};
