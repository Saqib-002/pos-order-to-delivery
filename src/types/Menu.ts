
export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  customIngredients?: string[];
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted?: boolean;
  menuItem?: MenuItem;
}

export interface MenuCategory {
  name: string;
  label: string;
  description: string;
}

export interface BaseMenuEntity {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category extends BaseMenuEntity {
  itemCount?: number;
  type: "category";
}

export interface Subcategory extends BaseMenuEntity {
  itemCount: number;
  categoryId: string;
  type: "subcategory";
}

export interface Product extends BaseMenuEntity {
  description: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  isAvailable: boolean;
  priority?: number;
  tax?: number;
  discount?: number;
  isDrink?: boolean;
  isByWeight?: boolean;
  isPerDiner?: boolean;
  isOutstanding?: boolean;
  isPlus18?: boolean;
  image?: string;
  type: "product";
}

export interface MenuComponentProps {
  token: string;
}

export interface ActionButtonsProps {
  currentLevel: "categories" | "subcategories" | "products";
  onCreateCategory: () => void;
  onCreateSubcategory: () => void;
  onCreateProduct: () => void;
  onCreateMenu: () => void;
}

export interface BreadcrumbProps {
  currentLevel: "categories" | "subcategories" | "products";
  selectedCategory: Category | null;
  selectedSubcategory: Subcategory | null;
  onBackToCategories: () => void;
  onBackToSubcategories: () => void;
}

export interface ContentSectionProps {
  currentLevel: "categories" | "subcategories" | "products";
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  selectedCategory: Category | null;
  selectedSubcategory: Subcategory | null;
  onCategoryClick: (category: Category) => void;
  onSubcategoryClick: (subcategory: Subcategory) => void;
  onEditCategory: (category: Category) => void;
  onEditSubcategory: (subcategory: Subcategory) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}
export interface ProductSectionProps {
  products: Product[];
  selectedSubcategory: Subcategory | null;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}
export interface SectionWrapperProps {
  title: string;
  children: React.ReactNode;
}
export interface SubcategorySectionProps {
  subcategories: Subcategory[];
  selectedCategory: Category | null;
  onSubcategoryClick: (subcategory: Subcategory) => void;
  onEditSubcategory: (subcategory: Subcategory) => void;
}
export interface CategorySectionProps {
  categories: Category[];
  onCategoryClick: (category: Category) => void;
  onEditCategory: (category: Category) => void;
}
