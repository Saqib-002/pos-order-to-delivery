import React, { useState, useEffect } from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import { CategoryModal } from "./CategoryModal";
import { SubcategoryModal } from "./SubcategoryModal";
import { ProductModal } from "./ProductModal";
import { MenuModal } from "./MenuModal";
import { toast } from "react-toastify";

// ICONS
import AddIcon from "../../assets/icons/add.svg?react";

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
  priority?: number;
  tax?: number;
  discount: number;
  isDrink?: boolean;
  isByWeight?: boolean;
  isPerDiner?: boolean;
  isOutstanding?: boolean;
  isPlus18?: boolean;
  image?: string;
}

interface MenuComponentProps {
  token: string;
}

export const MenuComponent: React.FC<MenuComponentProps> = ({ token }) => {
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

  const getCategories = async () => {
    const res = await (window as any).electronAPI.getCategories(token);
    if (!res.status) {
      toast.error("Unable to get categories");
      return;
    }
    setCategories(res.data.map((c: any) => ({ ...c, name: c.categoryName })));
  };

  const getSubcategories = async (id: string) => {
    const res = await (window as any).electronAPI.getSubcategories(token, id);
    if (!res.status) {
      toast.error("Unable to get subcategories");
      return;
    }
    setSubcategories(res.data);
  };
  const getProducts = async () => {
    const res = await (window as any).electronAPI.getProducts(token);
    if (!res.status) {
      toast.error("Unable to get products");
      return;
    }
    setProducts(res.data);
  };

  useEffect(() => {
    getCategories();
    getProducts();
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
                <AddIcon className="size-5" />
                CREATE CATEGORY
              </button>
            )}

            {currentLevel === "subcategories" && (
              <button
                onClick={handleCreateSubcategory}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <AddIcon className="size-5" />
                CREATE SUBCATEGORY
              </button>
            )}

            {currentLevel === "products" && (
              <button
                onClick={handleCreateProduct}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <AddIcon className="size-5" />
                CREATE PRODUCT
              </button>
            )}

            <button
              onClick={handleCreateMenu}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <AddIcon className="size-5" />
              CREATE MENU
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {currentLevel !== "categories" && (
        <div className="mb-4 flex justify-end">
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
        </div>
      )}

      {/* Dynamic Content Based on Current Level */}
      {currentLevel === "categories" && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
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
        token={token}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
          setSubcategories([]); // Clear subcategories when modal closes
        }}
        onSuccess={handleProductSuccess}
        product={editingProduct}
        categories={categories}
        subcategories={subcategories}
        onFetchSubcategories={getSubcategories}
        onClearSubcategories={() => setSubcategories([])}
      />

      <MenuModal
        isOpen={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
        onSuccess={handleMenuSuccess}
      />
    </>
  );
};
