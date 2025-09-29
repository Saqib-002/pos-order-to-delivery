import {
  fetchCategories,
  fetchProductsByCatIdForOrder,
  fetchSubcategories,
  fetchMenusBySubcategory,
} from "@/renderer/utils/menu";
import { Category, SubCategory } from "@/types/categories";
import React, { useEffect, useState } from "react";
import { Product } from "@/types/Menu";
import OrderTakingForm from "./OrderTakingForm";
import CategorySelection from "./CategorySelection";
import SubcategorySelection from "./SubcategorySelection";
import ProductGrid from "./ProductGrid";
import BreadcrumbNavigation from "./BreadcrumbNavigation";
import { UnifiedCard } from "../ui/UnifiedCard";

interface OrderMenuProps {
  token: string | null;
}

const OrderMenu = ({ token }: OrderMenuProps) => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[] | null>(
    null
  );
  const [products, setProducts] = useState<Product[] | null>(null);
  const [menus, setMenus] = useState<any[] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<SubCategory | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    await fetchCategories(token, setCategories);
    setIsLoadingCategories(false);
  };

  const handleSelectCategory = async (category: Category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setProducts(null);
    setIsLoadingSubcategories(true);
    await fetchSubcategories(category.id, token, setSubCategories);
    setIsLoadingSubcategories(false);
  };

  const handleSelectSubCategory = async (subcategory: SubCategory) => {
    setSelectedSubcategory(subcategory);
    setProducts(null);
    setMenus(null);
    setIsLoadingProducts(true);
    setIsLoadingMenus(true);

    // Fetch both products and menus for this subcategory
    await Promise.all([
      fetchProductsByCatIdForOrder(token, subcategory.id, setProducts),
      fetchMenusBySubcategory(token, subcategory.id, setMenus),
    ]);

    setIsLoadingProducts(false);
    setIsLoadingMenus(false);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSubCategories(null);
    setProducts(null);
    setMenus(null);
  };

  const handleBackToSubcategories = () => {
    setSelectedSubcategory(null);
    setProducts(null);
    setMenus(null);
  };

  const handleMenuSelect = (menu: any) => {
    setSelectedProduct({
      ...menu,
      id: menu.id,
      name: menu.name,
      description: menu.description || "",
      price: menu.price,
      categoryId: selectedCategory?.id || "",
      subcategoryId: selectedSubcategory?.id || "",
      isAvailable: true,
      type: "product",
      isMenu: true,
      menuId: menu.id,
    } as any);
  };

  return (
    <div className="h-full flex flex-col">
      {selectedProduct && (
        <OrderTakingForm
          token={token}
          product={selectedProduct}
          setProduct={setSelectedProduct}
        />
      )}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-7xl mx-auto">
          <BreadcrumbNavigation
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onBackToCategories={handleBackToCategories}
            onBackToSubcategories={handleBackToSubcategories}
          />

          <CategorySelection
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={handleSelectCategory}
            isLoading={isLoadingCategories}
          />

          {selectedCategory && (
            <SubcategorySelection
              subcategories={subCategories}
              selectedSubcategory={selectedSubcategory}
              onSubcategorySelect={handleSelectSubCategory}
              isLoading={isLoadingSubcategories}
            />
          )}

          {selectedSubcategory && (
            <div className="space-y-6">
              {/* Items Section */}
              {(products && products.length > 0) ||
              (menus && menus.length > 0) ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Available Items
                  </h3>

                  {/* Products */}
                  {products && products.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-700 mb-3">
                        Products
                      </h4>
                      <ProductGrid
                        products={products}
                        onProductSelect={setSelectedProduct}
                        isLoading={isLoadingProducts}
                      />
                    </div>
                  )}

                  {/* Menus */}
                  {menus && menus.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-3">
                        Menus
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {isLoadingMenus
                          ? [...Array(4)].map((_, index) => (
                              <div
                                key={index}
                                className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
                              >
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                              </div>
                            ))
                          : menus.map((menu) => (
                              <div
                                key={menu.id}
                                onClick={() => handleMenuSelect(menu)}
                                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                    {menu.name}
                                  </h4>
                                  <div className="text-sm font-medium text-indigo-600">
                                    €{Number(menu.price || 0).toFixed(2)}
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
                                  Click to process menu
                                </div>
                              </div>
                            ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Items Available
                  </h3>
                  <p className="text-gray-500">
                    No products or menus available in this subcategory.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderMenu;
