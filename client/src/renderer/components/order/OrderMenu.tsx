import {
  fetchCategories,
  fetchProductsByCatIdForOrder,
  fetchSubcategories,
  fetchMenusBySubcategory,
} from "@/renderer/utils/menu";
import { Category, SubCategory } from "@/types/categories";
import { useEffect, useState } from "react";
import { Product } from "@/types/Menu";
import OrderTakingForm from "./OrderTakingForm";
import CategorySelection from "./CategorySelection";
import SubcategorySelection from "./SubcategorySelection";
import ProductGrid from "./ProductGrid";
import BreadcrumbNavigation from "./BreadcrumbNavigation";
import { useAuth } from "@/renderer/contexts/AuthContext";
import MenuOrderTakingForm from "./MenuOrderTakingForm";
import { useOrder } from "@/renderer/contexts/OrderContext";
import { UnifiedCard } from "@/renderer/components/ui/UnifiedCard";
import { DocumentIcon } from "@/renderer/public/Svg";
import { useTranslation } from "react-i18next"; 
const OrderMenu = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[] | null>(
    null
  );
  const {
    clearProcessedMenuOrderItems,
    setSelectedProduct,
    selectedProduct,
    selectedMenu,
    setSelectedMenu,
    setMode,
    setEditingGroup,
    setEditingProduct,
  } = useOrder();
  const {
    auth: { token },
  } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [menus, setMenus] = useState<any[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<SubCategory | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);
  const [currentOrderItem, setCurrentOrderItem] = useState<any>(null);

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
  const handleSelectProduct = (product: Product) => {
    setMode("product");
    setSelectedProduct(product);
    setEditingGroup(null);
    setEditingProduct(null);
    setCurrentOrderItem(null);
  };
  const handleMenuSelect = (menu: any) => {
    setMode("menu");
    setEditingGroup(null);
    clearProcessedMenuOrderItems();
    setSelectedMenu(menu);
  };
  return (
    <>
      {selectedProduct && (
        <OrderTakingForm token={token} currentOrderItem={currentOrderItem} />
      )}
      {selectedMenu && (
        <MenuOrderTakingForm
          token={token}
          setCurrentOrderItem={setCurrentOrderItem}
        />
      )}
      <div className="w-full mx-auto p-4">
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
          cardLayout={"row"}
        />

        {selectedCategory && (
          <SubcategorySelection
            subcategories={subCategories}
            selectedSubcategory={selectedSubcategory}
            onSubcategorySelect={handleSelectSubCategory}
            isLoading={isLoadingSubcategories}
            cardLayout={"row"}
          />
        )}

        {selectedSubcategory && (
          <div className="space-y-6">
            {/* Items Section */}
            {(products && products.length > 0) ||
              (menus && menus.length > 0) ? (
              <div>
                {/* Products */}
                {products && products.length > 0 && (
                  <div className="mb-6">
                    <ProductGrid
                      products={products}
                      onProductSelect={(p) => handleSelectProduct(p)}
                      isLoading={isLoadingProducts}
                    />
                  </div>
                )}

                {/* Menus */}
                {menus && menus.length > 0 && (
                  <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {t("menuComponents.menus.title")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {isLoadingMenus
                        ? [...Array(4)].map((_, index) => (
                          <div
                            key={index}
                            className="transform transition-all duration-200"
                          >
                            <div className="bg-gray-500 text-white border-gray-500 rounded-lg p-3 border-2 animate-pulse">
                              <div className="flex items-center justify-between mb-2">
                                <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-300 rounded w-8"></div>
                              </div>
                              <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                              <div className="flex items-center justify-between">
                                <div className="h-4 bg-gray-300 rounded w-16"></div>
                                <div className="h-5 bg-gray-300 rounded w-12"></div>
                              </div>
                            </div>
                          </div>
                        ))
                        : menus.map((menu) => (
                          <div
                            key={menu.id}
                            className="transform transition-all duration-200"
                          >
                            <UnifiedCard
                              data={{
                                id: menu.id,
                                name: menu.name,
                                imgUrl: menu.imgUrl,
                                description: menu.description,
                                price: menu.price,
                                color: menu.color || "gray",
                                isAvailable: true,
                              }}
                              type="menu"
                              onClick={() => handleMenuSelect(menu)}
                              onEdit={() => { }}
                              showActions={false}
                            />
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
                  <DocumentIcon className="size-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-black mb-2">
                  {t("menuComponents.emptyMessages.noItemsAvailable")}
                </h3>
                <p className="text-gray-500">
                  {t("menuComponents.emptyMessages.noItemsAvailableDescription")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default OrderMenu;
