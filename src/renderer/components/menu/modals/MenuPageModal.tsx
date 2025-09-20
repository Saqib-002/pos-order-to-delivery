import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CustomSelect } from "../../ui/CustomSelect";

interface MenuPageProduct {
  id: string;
  name: string;
  supplement: number;
  priority: number;
}

interface MenuPage {
  id: string;
  name: string;
  description: string;
  products: MenuPageProduct[];
}

interface MenuPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMenuPage: MenuPage | null;
  token: string;
}

export const MenuPageModal: React.FC<MenuPageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingMenuPage,
  token,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [products, setProducts] = useState<MenuPageProduct[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    supplement: 0,
    priority: 0,
  });

  // Available products for selection
  const availableProducts = [
    { value: "Coca Cola", label: "Coca Cola" },
    { value: "Water", label: "Water" },
    { value: "Chicken Kebab", label: "Chicken Kebab" },
    { value: "Lamb Kebab", label: "Lamb Kebab" },
    { value: "Chicken Durum", label: "Chicken Durum" },
    { value: "Falafel", label: "Falafel" },
    { value: "Hamburger", label: "Hamburger" },
    { value: "Pizza", label: "Pizza" },
    { value: "Pasta", label: "Pasta" },
    { value: "Salad", label: "Salad" },
    { value: "Soup", label: "Soup" },
    { value: "Rice", label: "Rice" },
    { value: "French Fries", label: "French Fries" },
    { value: "Meat", label: "Meat" },
    { value: "Soft Drink", label: "Soft Drink" },
  ];

  useEffect(() => {
    if (editingMenuPage) {
      setFormData({
        name: editingMenuPage.name,
        description: editingMenuPage.description || "",
      });
      setProducts(editingMenuPage.products || []);
    } else {
      setFormData({
        name: "",
        description: "",
      });
      setProducts([]);
    }
    setNewProduct({
      name: "",
      supplement: 0,
      priority: 0,
    });
  }, [editingMenuPage, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]:
        name === "supplement" || name === "priority" ? Number(value) : value,
    }));
  };

  const handleProductSelect = (value: string) => {
    setNewProduct((prev) => ({
      ...prev,
      name: value,
    }));
  };

  const handleAddProduct = () => {
    if (!newProduct.name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    const product: MenuPageProduct = {
      id: Date.now().toString(),
      name: newProduct.name,
      supplement: newProduct.supplement,
      priority: newProduct.priority,
    };

    setProducts((prev) => [...prev, product]);
    setNewProduct({
      name: "",
      supplement: 0,
      priority: 0,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a page name");
      return;
    }

    if (formData.description && formData.description.length > 40) {
      toast.error("Description must be 40 characters or less");
      return;
    }

    try {
      // TODO: Replace with actual API call
      console.log("Menu Page Data:", {
        ...formData,
        products,
      });

      toast.success(
        editingMenuPage
          ? "Menu page updated successfully"
          : "Menu page created successfully"
      );
      onSuccess();
    } catch (error) {
      toast.error("Failed to save menu page");
    }
  };

  const handleEliminate = () => {
    if (window.confirm("Are you sure you want to delete this menu page?")) {
      // TODO: Replace with actual API call
      console.log("Delete menu page:", editingMenuPage?.id);
      toast.success("Menu page deleted successfully");
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 uppercase">
              {editingMenuPage ? "EDIT MENU PAGE" : "CREATE MENU PAGE"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Page Details Section */}
            <div className="mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAGE NAME
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter page name"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DESCRIPTION
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Brief description (maximum 40 characters)"
                  maxLength={40}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/40 characters
                </p>
              </div>
            </div>

            {/* Product Addition Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                PRODUCT
              </h3>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PRODUCT
                  </label>
                  <CustomSelect
                    options={availableProducts}
                    value={newProduct.name}
                    onChange={handleProductSelect}
                    placeholder="Select a product"
                    className="w-full"
                  />
                </div>

                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SUPPLEMENT
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-gray-500 text-sm">
                      €
                    </span>
                    <input
                      type="number"
                      name="supplement"
                      value={newProduct.supplement}
                      onChange={handleNewProductChange}
                      className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PRIORITY
                  </label>
                  <input
                    type="number"
                    name="priority"
                    value={newProduct.priority}
                    onChange={handleNewProductChange}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    ADD
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Products List */}
            {products.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  PRODUCTS
                </h3>
                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-gray-100 rounded-md"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {product.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          € {product.supplement.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-600">
                          Priority: {product.priority}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md transition-colors duration-200"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>

              {editingMenuPage && (
                <button
                  type="button"
                  onClick={handleEliminate}
                  className="text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
                >
                  Eliminate
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
