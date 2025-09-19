import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CustomSelect } from "../ui/CustomSelect";

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
  discount?: number;
  isDrink?: boolean;
  isByWeight?: boolean;
  isPerDiner?: boolean;
  isOutstanding?: boolean;
  isPlus18?: boolean;
  image?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
  categories: any[];
  subcategories: any[];
  isEditMode?: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
  subcategories,
  isEditMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<
    "general" | "variants" | "printers" | "allergens" | "rules"
  >("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssociatedProducts, setShowAssociatedProducts] = useState(false);

  // Variants and Add-ons state
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [variantPrices, setVariantPrices] = useState<Record<string, number>>(
    {}
  );
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const [showAddons, setShowAddons] = useState(true);
  const [selectedAddonPage, setSelectedAddonPage] = useState(1);
  const [addonPageSetup, setAddonPageSetup] = useState({
    minComplements: 0,
    maxComplements: 0,
    freeAddons: 0,
  });
  const [selectedPluginGroups, setSelectedPluginGroups] = useState<string[]>(
    []
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    priority: 0,
    tax: 10,
    discount: 0,
    categoryId: "",
    subcategoryId: "",
    isAvailable: true,
    isOutOfStock: false,
    isDrink: false,
    isByWeight: false,
    isPerDiner: false,
    isOutstanding: false,
    isPlus18: false,
  });

  // Mock data for associated products
  const associatedProducts = [
    { id: "1", name: "Margherita Pizza", price: 12.99, category: "Pizza" },
    { id: "2", name: "Pepperoni Pizza", price: 14.99, category: "Pizza" },
    { id: "3", name: "Caesar Salad", price: 8.99, category: "Salad" },
    { id: "4", name: "Chicken Wings", price: 9.99, category: "Appetizer" },
    { id: "5", name: "Chocolate Cake", price: 6.99, category: "Dessert" },
  ];

  // Mock data for variants (from VariantView)
  const availableVariants = [
    {
      id: "1",
      name: "Size Variants",
      groupName: "Pizza Sizes",
      variantCount: 3,
      color: "blue",
      items: [
        { id: "1", name: "Small", priority: 1 },
        { id: "2", name: "Medium", priority: 2 },
        { id: "3", name: "Large", priority: 3 },
      ],
    },
    {
      id: "2",
      name: "Flavor Variants",
      groupName: "Ice Cream",
      variantCount: 5,
      color: "green",
      items: [
        { id: "4", name: "Vanilla", priority: 1 },
        { id: "5", name: "Chocolate", priority: 2 },
        { id: "6", name: "Strawberry", priority: 3 },
        { id: "7", name: "Mint", priority: 4 },
        { id: "8", name: "Pistachio", priority: 5 },
      ],
    },
    {
      id: "3",
      name: "Temperature",
      groupName: "Beverages",
      variantCount: 2,
      color: "orange",
      items: [
        { id: "9", name: "Hot", priority: 1 },
        { id: "10", name: "Cold", priority: 2 },
      ],
    },
    {
      id: "4",
      name: "Spice Level",
      groupName: "Curry Dishes",
      variantCount: 4,
      color: "red",
      items: [
        { id: "11", name: "Mild", priority: 1 },
        { id: "12", name: "Medium", priority: 2 },
        { id: "13", name: "Hot", priority: 3 },
        { id: "14", name: "Extra Hot", priority: 4 },
      ],
    },
    {
      id: "5",
      name: "Cooking Style",
      groupName: "Meat Dishes",
      variantCount: 3,
      color: "purple",
      items: [
        { id: "15", name: "Rare", priority: 1 },
        { id: "16", name: "Medium", priority: 2 },
        { id: "17", name: "Well Done", priority: 3 },
      ],
    },
  ];

  // Mock data for plugin groups
  const pluginGroups = [
    { id: "1", name: "Remove Option", color: "red", isSelected: true },
    { id: "2", name: "Rice Or Potatoes", color: "green", isSelected: false },
    { id: "3", name: "Add Option", color: "blue", isSelected: false },
    {
      id: "4",
      name: "Add Option (Hamburger)",
      color: "orange",
      isSelected: false,
    },
    {
      id: "5",
      name: "Add Option (Falafel Product)",
      color: "purple",
      isSelected: false,
    },
    {
      id: "6",
      name: "Option To Choose In Box",
      color: "yellow",
      isSelected: false,
    },
    {
      id: "7",
      name: "Remove Option (Hamburger)",
      color: "red",
      isSelected: false,
    },
    {
      id: "8",
      name: "Remove Option On Plates",
      color: "gray",
      isSelected: false,
    },
  ];

  // Get category options for CustomSelect
  const getCategoryOptions = () => {
    return [
      { value: "", label: "Select category" },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ];
  };

  // Get subcategory options for CustomSelect
  const getSubcategoryOptions = () => {
    const filteredSubcategories = subcategories.filter(
      (subcategory) => subcategory.categoryId === formData.categoryId
    );
    return [
      { value: "", label: "Select subcategory" },
      ...filteredSubcategories.map((subcategory) => ({
        value: subcategory.id,
        label: subcategory.name,
      })),
    ];
  };

  // Get variant options for CustomSelect
  const getVariantOptions = () => {
    return availableVariants.map((variant) => ({
      value: variant.id,
      label: `${variant.name} (${variant.groupName})`,
    }));
  };

  // Handle variant selection
  const handleVariantChange = (variantIds: string[]) => {
    setSelectedVariants(variantIds);
    // Initialize prices for new variant items
    const newPrices = { ...variantPrices };
    variantIds.forEach((variantId) => {
      const variant = availableVariants.find((v) => v.id === variantId);
      if (variant) {
        variant.items.forEach((item) => {
          const itemKey = `${variantId}-${item.id}`;
          if (!(itemKey in newPrices)) {
            newPrices[itemKey] = 0; // Default price for new items
          }
        });
      }
    });
    setVariantPrices(newPrices);
  };

  // Handle variant item price change
  const handleVariantItemPriceChange = (
    variantId: string,
    itemId: string,
    price: number
  ) => {
    const itemKey = `${variantId}-${itemId}`;
    setVariantPrices((prev) => ({
      ...prev,
      [itemKey]: price,
    }));
  };

  // Get selected variant items
  const getSelectedVariantItems = () => {
    return selectedVariants
      .map((variantId) => {
        const variant = availableVariants.find((v) => v.id === variantId);
        return variant ? { ...variant, items: variant.items } : null;
      })
      .filter(
        (variant): variant is NonNullable<typeof variant> => variant !== null
      );
  };

  // Handle plugin group selection
  const handlePluginGroupToggle = (groupId: string) => {
    setSelectedPluginGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Get color classes for plugin groups
  const getPluginGroupColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      red: "bg-red-500 hover:bg-red-600",
      green: "bg-green-500 hover:bg-green-600",
      blue: "bg-blue-500 hover:bg-blue-600",
      orange: "bg-orange-500 hover:bg-orange-600",
      purple: "bg-purple-500 hover:bg-purple-600",
      yellow: "bg-yellow-500 hover:bg-yellow-600",
      gray: "bg-gray-500 hover:bg-gray-600",
    };
    return colorMap[color] || "bg-gray-500 hover:bg-gray-600";
  };

  useEffect(() => {
    if (product && isEditMode) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || 0,
        priority: product.priority || 0,
        tax: product.tax || 10,
        discount: product.discount || 0,
        categoryId: product.categoryId || "",
        subcategoryId: product.subcategoryId || "",
        isAvailable: product.isAvailable ?? true,
        isOutOfStock: false,
        isDrink: product.isDrink || false,
        isByWeight: product.isByWeight || false,
        isPerDiner: product.isPerDiner || false,
        isOutstanding: product.isOutstanding || false,
        isPlus18: product.isPlus18 || false,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        priority: 0,
        tax: 10,
        discount: 0,
        categoryId: "",
        subcategoryId: "",
        isAvailable: true,
        isOutOfStock: false,
        isDrink: false,
        isByWeight: false,
        isPerDiner: false,
        isOutstanding: false,
        isPlus18: false,
      });
    }
  }, [product, isOpen, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    if (!formData.categoryId) {
      toast.error("Please select a category.");
      return;
    }

    if (!formData.subcategoryId) {
      toast.error("Please select a subcategory.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(
        `Product "${formData.name}" ${isEditMode ? "updated" : "created"} successfully!`
      );
      onSuccess();
    } catch (error) {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} product.`);
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} product:`,
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredSubcategories = () => {
    if (!formData.categoryId) return [];
    return subcategories.filter(
      (sub) => sub.categoryId === formData.categoryId
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? "EDIT PRODUCT" : "CREATE PRODUCT"}
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
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 border-b border-gray-200">
          <div className="flex space-x-8">
            {[
              { id: "general", label: "GENERAL" },
              { id: "variants", label: "VARIANTS AND ADD-ONS" },
              { id: "printers", label: "PRINTERS" },
              { id: "allergens", label: "ALLERGENS" },
              { id: "rules", label: "SPECIFIC RULES" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Product Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Product Status
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Activated</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isAvailable: !formData.isAvailable,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        formData.isAvailable ? "bg-orange-500" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          formData.isAvailable
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="outOfStock"
                      checked={formData.isOutOfStock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isOutOfStock: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="outOfStock"
                      className="text-sm text-gray-700"
                    >
                      Product out of stock
                    </label>
                  </div>
                </div>
              </div>

              {/* Basic Product Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Basic Product Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NAME *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ASSOCIATED CATEGORY *
                    </label>
                    <CustomSelect
                      options={getCategoryOptions()}
                      value={formData.categoryId}
                      onChange={(value: string) =>
                        setFormData({
                          ...formData,
                          categoryId: value,
                          subcategoryId: "",
                        })
                      }
                      placeholder="Select category"
                      portalClassName="product-category-dropdown-portal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ASSOCIATED SUBCATEGORY *
                    </label>
                    <CustomSelect
                      options={getSubcategoryOptions()}
                      value={formData.subcategoryId}
                      onChange={(value: string) =>
                        setFormData({
                          ...formData,
                          subcategoryId: value,
                        })
                      }
                      placeholder="Select subcategory"
                      portalClassName="product-subcategory-dropdown-portal"
                      disabled={!formData.categoryId}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DESCRIPTION
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Write a description (Max 150 characters)"
                    rows={3}
                    maxLength={150}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/150 characters
                  </p>
                </div>
              </div>

              {/* Pricing and Financials */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pricing and Financials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PRICE *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">
                        €
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PRIORITY
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TAX
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-2 text-gray-500">
                        %
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.tax}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tax: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DISCOUNT
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">
                        €
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Attributes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Product Attributes
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "isDrink", label: "It is a drink" },
                    { key: "isByWeight", label: "Product by weight" },
                    { key: "isPerDiner", label: "Product per diner" },
                    { key: "isOutstanding", label: "Outstanding" },
                    { key: "isPlus18", label: "Product +18" },
                  ].map((attr) => (
                    <div key={attr.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={attr.key}
                        checked={
                          formData[attr.key as keyof typeof formData] as boolean
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [attr.key]: e.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-orange-600"
                      />
                      <label
                        htmlFor={attr.key}
                        className="text-sm text-gray-700"
                      >
                        {attr.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Associated Products */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowAssociatedProducts(true)}
                  className="text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  See associated products
                </button>
              </div>
            </div>
          )}

          {activeTab === "variants" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                VARIANTS AND ADD-ONS
              </h3>

              {/* Assign Variants Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    ASSIGN VARIANTS
                  </label>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <div className="border border-gray-300 rounded-md p-3 min-h-[40px] bg-white">
                  {selectedVariants.length === 0 ? (
                    <span className="text-gray-500">Select variants</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedVariants.map((variantId) => {
                        const variant = availableVariants.find(
                          (v) => v.id === variantId
                        );
                        return (
                          <span
                            key={variantId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-md"
                          >
                            {variant?.name}
                            <button
                              type="button"
                              onClick={() =>
                                handleVariantChange(
                                  selectedVariants.filter(
                                    (id) => id !== variantId
                                  )
                                )
                              }
                              className="text-orange-600 hover:text-orange-800"
                            >
                              <svg
                                className="w-3 h-3"
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
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Variant Selection Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowVariantDropdown(!showVariantDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    Add variants...
                  </button>

                  {showVariantDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {availableVariants.map((variant) => (
                        <label
                          key={variant.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedVariants.includes(variant.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleVariantChange([
                                  ...selectedVariants,
                                  variant.id,
                                ]);
                              } else {
                                handleVariantChange(
                                  selectedVariants.filter(
                                    (id) => id !== variant.id
                                  )
                                );
                              }
                            }}
                            className="h-4 w-4 accent-orange-600"
                          />
                          <span className="text-sm text-gray-700">
                            {variant.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Variants and their Items */}
                {selectedVariants.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      Selected Variants and Items
                    </h4>
                    {getSelectedVariantItems().map((variant) => (
                      <div
                        key={variant.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className={`w-3 h-3 rounded-full bg-${variant.color}-500`}
                          ></div>
                          <h5 className="font-medium text-gray-900">
                            {variant.name}
                          </h5>
                          <span className="text-xs text-gray-500">
                            ({variant.groupName})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {variant.items.map((item) => {
                            const itemKey = `${variant.id}-${item.id}`;
                            return (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 bg-white p-2 rounded border"
                              >
                                <label className="text-sm text-gray-600 min-w-[100px]">
                                  {item.name}:
                                </label>
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">€</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={variantPrices[itemKey] || 0}
                                    onChange={(e) =>
                                      handleVariantItemPriceChange(
                                        variant.id,
                                        item.id,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Show add-ons when adding a product */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showAddons"
                    checked={showAddons}
                    onChange={(e) => setShowAddons(e.target.checked)}
                    className="h-4 w-4 accent-orange-600"
                  />
                  <label
                    htmlFor="showAddons"
                    className="text-sm font-medium text-gray-700"
                  >
                    Show add-ons when adding a product
                  </label>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Select Add-ons Page */}
              {showAddons && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                      SELECT ADD-ONS PAGE
                    </label>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>

                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setSelectedAddonPage(page)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          selectedAddonPage === page
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Page Setup */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        PAGE {selectedAddonPage} SETUP
                      </label>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum number of complements
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={addonPageSetup.minComplements}
                          onChange={(e) =>
                            setAddonPageSetup((prev) => ({
                              ...prev,
                              minComplements: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum number of complements
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={addonPageSetup.maxComplements}
                          onChange={(e) =>
                            setAddonPageSetup((prev) => ({
                              ...prev,
                              maxComplements: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          No. of free add-ons
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={addonPageSetup.freeAddons}
                          onChange={(e) =>
                            setAddonPageSetup((prev) => ({
                              ...prev,
                              freeAddons: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Plugin Group */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    ADD PLUGIN GROUP
                  </label>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {pluginGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => handlePluginGroupToggle(group.id)}
                      className={`relative px-4 py-3 rounded-md text-sm font-medium text-white transition-colors duration-200 ${getPluginGroupColorClasses(group.color)} ${
                        selectedPluginGroups.includes(group.id)
                          ? "ring-2 ring-orange-500 ring-offset-2"
                          : ""
                      }`}
                    >
                      {group.name}
                      {selectedPluginGroups.includes(group.id) && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "printers" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Printers</h3>
              <p className="text-gray-600">Configure printer settings here.</p>
              {/* TODO: Implement printer configuration */}
            </div>
          )}

          {activeTab === "allergens" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Allergens</h3>
              <p className="text-gray-600">
                Configure allergen information here.
              </p>
              {/* TODO: Implement allergen configuration */}
            </div>
          )}

          {activeTab === "rules" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Specific Rules
              </h3>
              <p className="text-gray-600">
                Configure specific business rules here.
              </p>
              {/* TODO: Implement specific rules configuration */}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isEditMode ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>

      {/* Associated Products Modal */}
      {showAssociatedProducts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Associated Products
                </h3>
                <button
                  onClick={() => setShowAssociatedProducts(false)}
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
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {associatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {product.name}
                      </h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">
                        €{product.price.toFixed(2)}
                      </span>
                      <button className="text-indigo-600 hover:text-indigo-800 text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {associatedProducts.length === 0 && (
                <div className="text-center py-8">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-gray-500">No associated products found</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAssociatedProducts(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ProductModal };
