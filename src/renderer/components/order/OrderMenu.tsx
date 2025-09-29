import {
  fetchCategories,
  fetchProductsByCatIdForOrder,
  fetchSubcategories,
} from "@/renderer/utils/menu";
import { Category, SubCategory } from "@/types/categories";
import React, { useEffect, useState } from "react";
import { Product } from "@/types/Menu";
import OrderTakingForm from "./OrderTakingForm";
import CategorySelection from "./CategorySelection";
import SubcategorySelection from "./SubcategorySelection";
import ProductGrid from "./ProductGrid";
import BreadcrumbNavigation from "./BreadcrumbNavigation";

interface OrderMenuProps {
  token: string | null;
}

const OrderMenu = ({ token }: OrderMenuProps) => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[] | null>(
    null
  );
  const [products, setProducts] = useState<Product[] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<SubCategory | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

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
    setIsLoadingProducts(true);
    await fetchProductsByCatIdForOrder(token, subcategory.id, setProducts);
    setIsLoadingProducts(false);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSubCategories(null);
    setProducts(null);
  };

  const handleBackToSubcategories = () => {
    setSelectedSubcategory(null);
    setProducts(null);
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
            <ProductGrid
              products={products}
              onProductSelect={setSelectedProduct}
              isLoading={isLoadingProducts}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderMenu;
