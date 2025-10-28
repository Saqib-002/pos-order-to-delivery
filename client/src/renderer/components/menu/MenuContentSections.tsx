import React from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import {
  ContentSectionProps,
  ProductSectionProps,
  SectionWrapperProps,
  SubcategorySectionProps,
  CategorySectionProps,
} from "@/types/Menu";
import { useTranslation } from "react-i18next";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const MenuContentSections: React.FC<ContentSectionProps> = ({
  currentLevel,
  categories,
  subcategories,
  products,
  onProductDragEnd,
  selectedCategory,
  selectedSubcategory,
  onCategoryClick,
  onSubcategoryClick,
  onEditCategory,
  onDeleteCategory,
  onEditSubcategory,
  onDeleteSubcategory,
  onEditProduct,
  onDeleteProduct,
}) => {

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
            products={products}
            selectedSubcategory={selectedSubcategory}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
            onProductDragEnd={onProductDragEnd!}
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
  onDeleteCategory,
}) => {
  const { t } = useTranslation();
  return (
    <SectionWrapper title={t("menuComponents.categories.title")}>
      <ItemGrid>
        {categories.length === 0 ? (
          <EmptyState message={t("menuComponents.categories.noCategories")} />
        ) : (
          categories.map((category) => (
            <UnifiedCard
              key={category.id}
              data={category}
              type="category"
              onDelete={() => onDeleteCategory(category.id)}
              onEdit={() => onEditCategory(category)}
              onClick={() => onCategoryClick(category)}
            />
          ))
        )}
      </ItemGrid>
    </SectionWrapper>
  );
};

const SubcategorySection: React.FC<SubcategorySectionProps> = ({
  subcategories,
  selectedCategory,
  onSubcategoryClick,
  onEditSubcategory,
  onDeleteSubcategory,
}) => {
  const { t } = useTranslation();
  return (
    <SectionWrapper title={`${t("menuComponents.subcategories.title")} in ${selectedCategory?.name}`}>
      <ItemGrid>
        {subcategories.length === 0 ? (
          <EmptyState message={t("menuComponents.subcategories.noSubcategories")} />
        ) : (
          subcategories.map((subcategory) => (
            <UnifiedCard
              key={subcategory.id}
              data={subcategory}
              type="subcategory"
              onEdit={() => onEditSubcategory(subcategory)}
              onClick={() => onSubcategoryClick(subcategory)}
              onDelete={() => onDeleteSubcategory(subcategory.id)}
            />
          ))
        )}
      </ItemGrid>
    </SectionWrapper>
  );
};
const SortableProductCard: React.FC<{ product: any, onEditProduct: (product: any) => void, onDeleteProduct: (product: any) => void }> = ({
  product,
  onEditProduct,
  onDeleteProduct,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <UnifiedCard
      ref={setNodeRef}
      style={style}
      data={product}
      type="product"
      onEdit={() => onEditProduct(product)}
      onDelete={() => onDeleteProduct(product)}
      dragAttributes={attributes}
      dragListeners={listeners}
    />
  );
};

const ProductSection: React.FC<ProductSectionProps & { onProductDragEnd: (event: DragEndEvent) => void }> = ({
  products,
  selectedSubcategory,
  onEditProduct,
  onDeleteProduct,
  onProductDragEnd,
}) => {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  return (
    <SectionWrapper title={`${t("menuComponents.products.title")} in ${selectedSubcategory?.name}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onProductDragEnd} // Pass the handler
      >
        <SortableContext
          items={products.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <ItemGrid>
            {products.length === 0 ? (
              <EmptyState message={t("menuComponents.products.noProducts")} />
            ) : (
              products.map((product) => (
                <SortableProductCard
                  key={product.id}
                  product={product}
                  onEditProduct={onEditProduct}
                  onDeleteProduct={onDeleteProduct}
                />
              ))
            )}
          </ItemGrid>
        </SortableContext>
      </DndContext>
    </SectionWrapper>
  );
};

const SectionWrapper: React.FC<SectionWrapperProps> = ({ title, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xl font-semibold text-black">{title}</h2>
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
