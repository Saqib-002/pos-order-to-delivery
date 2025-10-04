import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CustomSelect } from "../../ui/CustomSelect";
import CrossIcon from "../../../assets/icons/cross.svg?react";
import DeleteIcon from "../../../assets/icons/delete.svg?react";
import AddIcon from "../../../assets/icons/add.svg?react";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { MenuPageProduct } from "@/types/menuPages";

interface MenuPage {
  id: string;
  name: string;
  description: string;
  products: Omit<MenuPageProduct, "menuPageId"|"createdAt"| "updatedAt">[];
}

interface MenuPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMenuPage: MenuPage | null;
  token: string|null;
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
  const [products, setProducts] = useState<Omit<MenuPageProduct, "menuPageId"|"createdAt"| "updatedAt">[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    supplement: 0,
    priority: 0,
  });
  const [availableProducts, setAvailableProducts] = useState<
    {
      value: string;
      label: string;
      productId?: string;
      disabled?: boolean;
    }[]
  >([]);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const res = await (window as any).electronAPI.getAllProducts(token);
      if (!res.status) {
        toast.error("Unable to get products");
        return;
      }

      const addedProductNames = products.map((p) => p.productName);
      const availableProducts = res.data.filter(
        (product: any) => !addedProductNames.includes(product.productName)
      );

      const productOptions = availableProducts.map((product: any) => ({
        value: product.id,
        label: product.name,
        productId: product.id,
      }));

      if (productOptions.length === 0) {
        productOptions.push({
          value: "",
          label: "No products available to add",
          disabled: true,
        });
      }

      setAvailableProducts(productOptions);
    } catch (error) {
      toast.error("Failed to fetch products");
    }
  };

  // Fetch existing menu page products
  const fetchMenuPageProducts = async (menuPageId: string) => {
    try {
      const res = await (window as any).electronAPI.getMenuPageProducts(
        token,
        menuPageId
      );
      if (res.status && res.data) {
        const existingProducts = res.data.map((product: any) => ({
          id: product.id,
          productName: product.productName,
          productId: product.productId,
          supplement: Number(product.supplement) || 0,
          priority: Number(product.priority) || 0,
        }));
        setProducts(existingProducts);
      }
    } catch (error) {
      console.error("Failed to fetch menu page products:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }

    if (editingMenuPage) {
      setFormData({
        name: editingMenuPage.name,
        description: editingMenuPage.description || "",
      });
      // Fetch existing products from database
      fetchMenuPageProducts(editingMenuPage.id);
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
  }, [editingMenuPage, isOpen, token]);

  // Refetch products when the products list changes
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [products, isOpen]);

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
      toast.error("Please select a product");
      return;
    }

    const selectedOption = availableProducts.find(
      (opt) => opt.value === newProduct.name
    );
    if (!selectedOption || selectedOption.disabled) {
      toast.error("No products available to add");
      return;
    }

    const product: Omit<MenuPageProduct, "menuPageId"|"createdAt"| "updatedAt"> = {
      id: `temp_${Date.now()}`,
      productName: selectedOption.label,
      productId: selectedOption.productId || selectedOption.value,
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

    if (products.length === 0) {
      toast.error("Please add at least one product to the menu page");
      return;
    }

    try {
      if (editingMenuPage) {
        const res = await (window as any).electronAPI.updateMenuPage(
          token,
          editingMenuPage.id,
          formData,
          products
        );
        if (!res.status) {
          console.log(res);
          toast.error("Failed to update menu page");
          return;
        }
      } else {
        const res = await (window as any).electronAPI.createMenuPage(
          token,
          formData,
          products
        );
        if (!res.status) {
          toast.error("Failed to create menu page");
          return;
        }
      }
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

  const handleEliminate = async () => {
    if (window.confirm("Are you sure you want to delete this menu page?")) {
      try {
        const res = await (window as any).electronAPI.deleteMenuPage(
          token,
          editingMenuPage!.id
        );
        if (!res.status) {
          toast.error("Failed to delete menu page");
          return;
        }
        toast.success("Menu page deleted successfully");
        onSuccess();
      } catch (error) {
        toast.error("Failed to delete menu page");
      }
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
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
            >
              <CrossIcon className="size-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Page Details Section */}
            <div className="mb-6">
              <CustomInput
                label="Page Name"
                name="name"
                type="text"
                required
                placeholder="Enter page name"
                value={formData.name}
                onChange={handleInputChange}
                inputClasses="focus:ring-orange-500"
                otherClasses="mb-4"
              />
              <CustomInput
                label="Description"
                name="description"
                type="text"
                placeholder="Brief description (maximum 40 characters)"
                value={formData.description}
                onChange={handleInputChange}
                inputClasses="focus:ring-orange-500"
                otherClasses="mb-4"
                maxLength={40}
              />
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
                    placeholder={
                      availableProducts.length === 1 &&
                      availableProducts[0].disabled
                        ? "No products available"
                        : "Select a product"
                    }
                    className="w-full"
                    disabled={
                      availableProducts.length === 1 &&
                      availableProducts[0].disabled
                    }
                  />
                </div>
                <CustomInput
                  label="SUPPLEMENT"
                  name="supplement"
                  type="number"
                  required
                  placeholder="Brief description (maximum 40 characters)"
                  value={newProduct.supplement}
                  onChange={handleNewProductChange}
                  inputClasses="focus:ring-orange-500 pl-8"
                  preLabel="€"
                  otherClasses="w-32"
                  min="0"
                  step="0.01"
                />
                <CustomInput
                  label="PRIORITY"
                  name="priority"
                  type="number"
                  required
                  placeholder="Brief description (maximum 40 characters)"
                  value={newProduct.priority}
                  onChange={handleNewProductChange}
                  inputClasses="focus:ring-orange-500"
                  otherClasses="w-32"
                  min="0"
                />
                <div className="flex justify-end">
                  <CustomButton
                    type="button"
                    label="Add"
                    variant="orange"
                    Icon={<AddIcon />}
                    onClick={handleAddProduct}
                  />
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
                          {product.productName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          € {Number(product.supplement).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-600">
                          Priority: {product.priority}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="cursor-pointer text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <DeleteIcon className="size-5" />
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
                <CustomButton type="submit" label="Keep" variant="yellow" />
                <CustomButton
                  type="button"
                  label="Close"
                  variant="secondary"
                  onClick={onClose}
                />
              </div>

              {editingMenuPage && (
                <CustomButton
                  type="button"
                  label="Eliminate"
                  variant="red"
                  onClick={handleEliminate}
                />
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
