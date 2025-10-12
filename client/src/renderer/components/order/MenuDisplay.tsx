import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface MenuPage {
  id: string;
  name: string;
  description?: string;
  products: MenuPageProduct[];
}

interface MenuPageProduct {
  id: string;
  productId: string;
  name: string;
  supplement: number;
  priority: number;
}

interface MenuDisplayProps {
  token: string | null;
}

const MenuDisplay: React.FC<MenuDisplayProps> = ({ token }) => {
  const [menuPages, setMenuPages] = useState<MenuPage[]>([]);
  const [selectedMenuPage, setSelectedMenuPage] = useState<MenuPage | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMenuPages();
  }, [token]);

  const fetchMenuPages = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const res = await (window as any).electronAPI.getMenuPages(token);
      if (!res.status) {
        toast.error("Unable to get menu pages");
        return;
      }
      setMenuPages(res.data);
    } catch (error) {
      toast.error("Failed to fetch menu pages");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuPageProducts = async (menuPageId: string) => {
    if (!token) return;

    try {
      const res = await (window as any).electronAPI.getMenuPageProducts(
        token,
        menuPageId
      );
      if (!res.status) {
        toast.error("Unable to get menu page products");
        return;
      }
      return res.data;
    } catch (error) {
      toast.error("Failed to fetch menu page products");
      return [];
    }
  };

  const handleMenuPageClick = async (menuPage: MenuPage) => {
    const products = await fetchMenuPageProducts(menuPage.id);
    setSelectedMenuPage({
      ...menuPage,
      products: products || [],
    });
  };

  const handleBackToMenuPages = () => {
    setSelectedMenuPage(null);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (selectedMenuPage) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={handleBackToMenuPages}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Menu Pages
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {selectedMenuPage.name}
          </h2>
          <div></div>
        </div>

        {/* Menu Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedMenuPage.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{selectedMenuPage.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedMenuPage.products.length > 0 ? (
              selectedMenuPage.products
                .sort((a, b) => a.priority - b.priority)
                .map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {product.name}
                      </h3>
                      {product.supplement > 0 && (
                        <span className="text-sm font-medium text-indigo-600">
                          +€{product.supplement.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {product.supplement > 0
                        ? "Additional charge"
                        : "Included"}
                    </div>
                  </div>
                ))
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-gray-400"
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
                  No Products
                </h3>
                <p className="text-gray-500">
                  This menu page has no products yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Menu Pages</h2>
        <p className="text-gray-600">Select a menu page to view its contents</p>
      </div>

      {/* Menu Pages Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuPages.length > 0 ? (
            menuPages.map((menuPage) => (
              <div
                key={menuPage.id}
                onClick={() => handleMenuPageClick(menuPage)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {menuPage.name}
                  </h3>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors"
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
                </div>
                {menuPage.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {menuPage.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
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
                No Menu Pages
              </h3>
              <p className="text-gray-500">
                No menu pages have been created yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuDisplay;
