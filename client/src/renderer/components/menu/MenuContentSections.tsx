import React from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import {
  ContentSectionProps,
  ProductSectionProps,
  SectionWrapperProps,
  SubcategorySectionProps,
  CategorySectionProps,
} from "@/types/Menu";

export const MenuContentSections: React.FC<ContentSectionProps> = ({
  currentLevel,
  categories,
  subcategories,
  products,
  selectedCategory,
  selectedSubcategory,
  onCategoryClick,
  onSubcategoryClick,
  onEditCategory,
  onDeleteCategory,
  onEditSubcategory,
  onDeleteSubcategory,
  onEditProduct,
  onDeleteProduct
}) => {
  const getFilteredProducts = () => {
    if (!selectedSubcategory) return [];
    return products.filter(
      (product) => product.subcategoryId === selectedSubcategory.id
    );
  };

  const renderSection = () => {
    switch (currentLevel) {
      case "categories":
        return (
          <CategorySection
            categories={categories}
            onCategoryClick={onCategoryClick}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
          />
        );

      case "subcategories":
        return (
          <SubcategorySection
            subcategories={subcategories}
            selectedCategory={selectedCategory}
            onSubcategoryClick={onSubcategoryClick}
            onEditSubcategory={onEditSubcategory}
            onDeleteSubcategory={onDeleteSubcategory}
          />
        );

      case "products":
        return (
          <ProductSection
            products={getFilteredProducts()}
            selectedSubcategory={selectedSubcategory}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
          />
        );

      default:
        return null;
    }
  };

  return <div className="mb-8">{renderSection()}</div>;
};

const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  onCategoryClick,
  onEditCategory,
  onDeleteCategory
}) => (
  <SectionWrapper title="Categories">
    <ItemGrid>
      {categories.length === 0 ? (
        <EmptyState message="No categories found. Please create a category." />
      ) : (
        categories.map((category) => (
          <UnifiedCard
            key={category.id}
            data={category}
            type="category"
            onDelete={()=>onDeleteCategory(category.id)}
            onEdit={() => onEditCategory(category)}
            onClick={() => onCategoryClick(category)}
          />
        ))
      )}
    </ItemGrid>
  </SectionWrapper>
);

const SubcategorySection: React.FC<SubcategorySectionProps> = ({
  subcategories,
  selectedCategory,
  onSubcategoryClick,
  onEditSubcategory,
  onDeleteSubcategory
}) => (
  <SectionWrapper title={`Subcategories in ${selectedCategory?.name}`}>
    <ItemGrid>
      {subcategories.length === 0 ? (
        <EmptyState message="No subcategories found. Please create a subcategory." />
      ) : (
        subcategories.map((subcategory) => (
          <UnifiedCard
            key={subcategory.id}
            data={subcategory}
            type="subcategory"
            onEdit={() => onEditSubcategory(subcategory)}
            onClick={() => onSubcategoryClick(subcategory)}
            onDelete={()=>onDeleteSubcategory(subcategory.id)}
          />
        ))
      )}
    </ItemGrid>
  </SectionWrapper>
);

const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  selectedSubcategory,
  onEditProduct,
  onDeleteProduct,
}) => (
  <SectionWrapper title={`Products in ${selectedSubcategory?.name}`}>
    <ItemGrid>
      {products.length === 0 ? (
        <EmptyState message="No products found in this subcategory." />
      ) : (
        products.map((product) => (
          <UnifiedCard
            key={product.id}
            data={product}
            type="product"
            onEdit={() => onEditProduct(product)}
            onDelete={() => onDeleteProduct(product)}
          />
        ))
      )}
    </ItemGrid>
  </SectionWrapper>
);

const SectionWrapper: React.FC<SectionWrapperProps> = ({ title, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    </div>
    {children}
  </div>
);

const ItemGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {children}
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="col-span-full flex items-center justify-center py-8">
    <p className="text-xl text-gray-500">{message}</p>
  </div>
);
