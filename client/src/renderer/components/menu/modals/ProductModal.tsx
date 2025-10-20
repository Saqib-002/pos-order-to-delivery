import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { CustomSelect } from "../../ui/CustomSelect";
import { getGroups, getVariants } from "@/renderer/utils/menu";
import { Variant } from "../VariantView";
import { Group } from "../GroupView";
import CrossIcon from "../../../public/icons/cross.svg?react";
import AddIcon from "../../../public/icons/add.svg?react";
import CheckMark from "../../../public/icons/mark.svg?react";
import CustomInput from "../../shared/CustomInput";
import CustomButton from "../../ui/CustomButton";
import { Product } from "@/types/Menu";
import { fetchPrinters } from "@/renderer/utils/printer";
import { ImgIcon } from "@/renderer/public/Svg";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
  categories: any[];
  subcategories: any[];
  onFetchSubcategories?: (categoryId: string) => Promise<void>;
  onClearSubcategories?: () => void;
  token: string | null;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
  subcategories,
  onFetchSubcategories,
  onClearSubcategories,
  token,
}) => {
  const [activeTab, setActiveTab] = useState<
    "general" | "variants" | "printers"
  >("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Variants and Add-ons state
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [variantPrices, setVariantPrices] = useState<Record<string, number>>(
    {}
  );
  const [variants, setVariants] = useState<Variant[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinterIds, setSelectedPrinterIds] = useState<string[]>([]);
  const [showAddons, setShowAddons] = useState(true);
  const [selectedAddonPage, setSelectedAddonPage] = useState(1);
  const [addonPages, setAddonPages] = useState<
    Array<{
      id: number;
      minComplements: number;
      maxComplements: number;
      freeAddons: number;
      pageNo: number;
      selectedGroup: string;
    }>
  >([
    {
      id: 1,
      minComplements: 0,
      maxComplements: 0,
      freeAddons: 0,
      pageNo: 1,
      selectedGroup: "",
    },
  ]);
  const [validationErrors, setValidationErrors] = useState<
    Record<number, string>
  >({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    priority: 0,
    tax: 0,
    discount: 0,
    categoryId: "",
    subcategoryId: "",
    imgUrl: "",
    isAvailable: true,
    isOutOfStock: false,
    isDrink: false,
    isByWeight: false,
    isPerDiner: false,
    isOutstanding: false,
    isPlus18: false,
    isForMenu: false,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    getVariants(token, setVariants);
    getGroups(token, (groups) =>
      setGroups(
        groups.map((group: any) => {
          return { ...group, isSelected: false };
        })
      )
    );
    fetchPrinters(token, setPrinters);
  }, []);
  useEffect(() => {
    if (product) {
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
        imgUrl: product.imgUrl || "",
        isDrink: product.isDrink || false,
        isByWeight: product.isByWeight || false,
        isPerDiner: product.isPerDiner || false,
        isOutstanding: product.isOutstanding || false,
        isPlus18: product.isPlus18 || false,
        isForMenu: product.isForMenu || false,
      });
      if (product.categoryId && onFetchSubcategories) {
        onFetchSubcategories(product.categoryId);
      }
      const getVariantAndGroups = async () => {
        const res = await (window as any).electronAPI.getVariantsByProductId(
          token,
          product.id
        );
        if (!res.status) {
          toast.error("Unable to get product's variant");
          return;
        }
        const newPrices = res.data.reduce((obj: any, item: any) => {
          obj[item.id] = item.price;
          return obj;
        }, {});
        handleVariantChange(res.data[0]?.variantId, newPrices);
        const groupRes = await (
          window as any
        ).electronAPI.getAddOnPagesByProductId(token, product.id);
        if (!groupRes.status) {
          toast.error("Unable to get product's addon pages");
          return;
        }
        if (groupRes.data.length === 0) {
          setAddonPages([
            {
              id: 1,
              minComplements: 0,
              maxComplements: 0,
              freeAddons: 0,
              pageNo: 1,
              selectedGroup: "",
            },
          ]);
          setSelectedAddonPage(1);
          return;
        }
        setAddonPages(
          groupRes.data.map((page: any) => {
            return {
              id: page.id,
              minComplements: page.minComplements,
              maxComplements: page.maxComplements,
              freeAddons: page.freeAddons,
              selectedGroup: page.selectedGroup,
              pageNo: page.pageNo,
            };
          })
        );
        setSelectedAddonPage(groupRes.data[0]?.pageNo);
        const printerRes = await (window as any).electronAPI.getProductPrinters(
          token,
          product.id
        );
        if (printerRes.status) {
          setSelectedPrinterIds(printerRes.data.map((p: any) => p.printerId));
        } else {
          toast.error("Unable to get product's printers");
        }
      };
      getVariantAndGroups();
      if (product.imgUrl) {
        setImagePreview(product.imgUrl);
      }
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        priority: 0,
        tax: 0,
        discount: 0,
        categoryId: "",
        subcategoryId: "",
        imgUrl: "",
        isAvailable: true,
        isOutOfStock: false,
        isDrink: false,
        isByWeight: false,
        isPerDiner: false,
        isOutstanding: false,
        isPlus18: false,
        isForMenu: false,
      });
      setAddonPages([
        {
          id: 1,
          minComplements: 0,
          maxComplements: 0,
          freeAddons: 0,
          selectedGroup: "",
          pageNo: 1,
        },
      ]);
      setSelectedVariant("");
      setVariantPrices({});
      setValidationErrors({});
      setSelectedPrinterIds([]);
      setImagePreview(null);
    }
  }, [product, isOpen]);
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
    return [
      { value: "", label: "Select subcategory" },
      ...subcategories.map((subcategory) => ({
        value: subcategory.id,
        label: subcategory.name,
      })),
    ];
  };

  // Get variant options for CustomSelect
  const getVariantOptions = () => {
    return variants.map((variant) => ({
      value: variant.id,
      label: `${variant.name}`,
    }));
  };

  // Handle variant selection
  const handleVariantChange = (variantId: string, newVariantPrices?: any) => {
    setSelectedVariant(variantId);
    // Initialize prices for new variant items
    const newPrices = newVariantPrices
      ? { ...newVariantPrices }
      : { ...variantPrices };
    if (variantId) {
      const variant = variants.find((v) => v.id === variantId);
      if (variant) {
        variant.items.forEach((item) => {
          const itemKey = item.id;
          if (!(itemKey in newPrices)) {
            newPrices[itemKey] = 0; // Default price for new items
          }
        });
      }
    }
    setVariantPrices(newPrices);
  };

  // Handle variant item price change
  const handleVariantItemPriceChange = (itemId: string, price: number) => {
    const itemKey = itemId;
    setVariantPrices((prev) => ({
      ...prev,
      [itemKey]: price,
    }));
  };

  // Get selected variant items
  const getSelectedVariantItems = () => {
    if (!selectedVariant) return [];
    const variant = variants.find((v) => v.id === selectedVariant);
    return variant ? [{ ...variant, items: variant.items }] : [];
  };

  // Add new addon page
  const addAddonPage = () => {
    const newPageId = Math.max(...addonPages.map((p) => p.id)) + 1;
    const newPageNo = Math.max(...addonPages.map((p) => p.pageNo)) + 1;
    setAddonPages((prev) => [
      ...prev,
      {
        id: newPageId,
        minComplements: 0,
        maxComplements: 0,
        freeAddons: 0,
        pageNo: newPageNo,
        selectedGroup: "",
      },
    ]);
    setSelectedAddonPage(newPageNo);
    // Clear validation errors for the new page
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[newPageNo];
      return newErrors;
    });
  };

  // Remove addon page
  const removeAddonPage = (pageNo: number) => {
    if (addonPages.length > 1) {
      setAddonPages((prev) => prev.filter((page) => page.pageNo !== pageNo));
      if (selectedAddonPage === pageNo) {
        setSelectedAddonPage(addonPages[0].pageNo);
      }
      // Clear validation errors for the removed page
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[pageNo];
        return newErrors;
      });
    }
  };

  // Handle plugin group selection for a specific page
  const handlePagePluginGroupChange = (pageNo: number, groupId: string) => {
    setAddonPages((prev) => {
      const updatedPages = prev.map((page) =>
        page.pageNo === pageNo ? { ...page, selectedGroup: groupId } : page
      );

      // Validate the updated page
      const updatedPage = updatedPages.find((page) => page.pageNo === pageNo);
      if (updatedPage && groupId) {
        const error = validateComplementLimits(
          pageNo,
          updatedPage.minComplements,
          updatedPage.maxComplements,
          groupId
        );

        setValidationErrors((prev) => ({
          ...prev,
          [pageNo]: error || "",
        }));
      } else {
        // Clear validation error if no group is selected
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[pageNo];
          return newErrors;
        });
      }

      return updatedPages;
    });
  };

  // Get available groups for a page (exclude already selected groups from other pages)
  const getAvailableGroupsForPage = (currentPageNo: number) => {
    const selectedGroups = addonPages
      .filter((page) => page.pageNo !== currentPageNo)
      .map((page) => page.selectedGroup)
      .filter(Boolean);

    return groups.filter((group) => !selectedGroups.includes(group.id));
  };

  // Handle addon page setup changes
  const handleAddonPageSetupChange = (
    pageNo: number,
    field: string,
    value: number
  ) => {
    setAddonPages((prev) => {
      const updatedPages = prev.map((page) =>
        page.pageNo === pageNo ? { ...page, [field]: value } : page
      );

      // Validate the updated page
      const updatedPage = updatedPages.find((page) => page.pageNo === pageNo);
      if (updatedPage && updatedPage.selectedGroup) {
        const error = validateComplementLimits(
          pageNo,
          updatedPage.minComplements,
          updatedPage.maxComplements,
          updatedPage.selectedGroup
        );

        setValidationErrors((prev) => ({
          ...prev,
          [pageNo]: error || "",
        }));
      } else {
        // Clear validation error if no group is selected
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[pageNo];
          return newErrors;
        });
      }

      return updatedPages;
    });
  };

  // Get current page data
  const getCurrentPageData = () => {
    return (
      addonPages.find((page) => page.pageNo === selectedAddonPage) ||
      addonPages[0]
    );
  };

  const getGroupItemCount = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.items.length : 0;
  };

  const validateComplementLimits = (
    pageNo: number,
    minComplements: number,
    maxComplements: number,
    groupId: string
  ) => {
    const groupItemCount = getGroupItemCount(groupId);
    const group = groups.find((g) => g.id === groupId);
    const groupName = group ? group.name : "selected group";

    if (minComplements > groupItemCount) {
      return `Minimum complements (${minComplements}) cannot exceed available items (${groupItemCount}) in "${groupName}".`;
    }

    if (maxComplements > groupItemCount) {
      return `Maximum complements (${maxComplements}) cannot exceed available items (${groupItemCount}) in "${groupName}".`;
    }

    if (minComplements > maxComplements) {
      return `Minimum complements (${minComplements}) cannot be greater than maximum complements (${maxComplements}).`;
    }

    return null;
  };

  // Check if current page has required fields filled to enable adding new page
  const canAddNewPage = () => {
    const lastPage = addonPages[addonPages.length - 1];
    return (
      !groups.every((group) =>
        addonPages.some((page) => page?.selectedGroup === group.id)
      ) && lastPage?.selectedGroup !== ""
    );
  };

  // Calculate price breakdown
  const calculatePriceBreakdown = () => {
    const basePrice = formData.price || 0;
    const discount = formData.discount || 0;
    const taxPercentage = formData.tax || 0;

    const tax = ((basePrice / (1 + taxPercentage / 100)) * taxPercentage) / 100;
    const subtotal = basePrice - tax;
    const total = basePrice - discount;

    return {
      subtotal: subtotal,
      taxAmount: tax,
      discount: discount,
      total: total,
    };
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

  // Get ring color classes for plugin groups
  const getPluginGroupRingClasses = (color: string) => {
    const ringMap: Record<string, string> = {
      red: "ring-red-500",
      green: "ring-green-500",
      blue: "ring-blue-500",
      orange: "ring-orange-500",
      purple: "ring-purple-500",
      yellow: "ring-yellow-500",
      gray: "ring-gray-500",
    };
    return ringMap[color] || "ring-gray-500";
  };

  // Get background color classes for checkmark
  const getPluginGroupCheckmarkClasses = (color: string) => {
    const checkmarkMap: Record<string, string> = {
      red: "bg-red-500",
      green: "bg-green-500",
      blue: "bg-blue-500",
      orange: "bg-orange-500",
      purple: "bg-purple-500",
      yellow: "bg-yellow-500",
      gray: "bg-gray-500",
    };
    return checkmarkMap[color] || "bg-gray-500";
  };

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
    if (!Object.keys(variantPrices).length) {
      toast.error("Please add at least one variant.");
      return;
    }

    const validAddonPages = addonPages.filter(
      (page) => page.selectedGroup && page.selectedGroup.trim() !== ""
    );
    if (validAddonPages.length === 0) {
      toast.error("Please add at least one addon page with a selected group.");
      return;
    }

    // Validate complement limits for all pages
    for (const page of validAddonPages) {
      const error = validateComplementLimits(
        page.pageNo,
        page.minComplements,
        page.maxComplements,
        page.selectedGroup
      );
      if (error) {
        toast.error(`Page ${page.pageNo}: ${error}`);
        setSelectedAddonPage(page.pageNo);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newFormData: { [key: string]: any } = {
        ...formData,
      };
      delete newFormData.categoryId;

      let res;
      if (!product) {
        res = await (window as any).electronAPI.createProduct(
          token,
          newFormData,
          variantPrices,
          validAddonPages,
          selectedPrinterIds
        );
      } else {
        res = await (window as any).electronAPI.updateProduct(
          token,
          { id: product.id, ...newFormData },
          variantPrices,
          validAddonPages,
          selectedPrinterIds
        );
      }
      if (!res.status) {
        toast.error(`Failed to ${product ? "update" : "create"} product.`);
        return;
      }
      toast.success(
        `Product "${formData.name}" ${product ? "updated" : "created"} successfully!`
      );
      onSuccess();
    } catch (error) {
      toast.error(`Failed to ${product ? "update" : "create"} product.`);
      console.error(
        `Failed to ${product ? "update" : "create"} product:`,
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, imgUrl: base64 });
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProductImage = () => {
    setFormData({ ...formData, imgUrl: "" });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">
              {product ? "EDIT PRODUCT" : "CREATE PRODUCT"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors duration-200"
            >
              <CrossIcon className="size-6" />
            </button>
          </div>
        </div>

        <div className="px-6 py-2 border-b border-gray-200">
          <div className="flex space-x-8">
            {[
              { id: "general", label: "GENERAL" },
              { id: "variants", label: "VARIANTS AND ADD-ONS" },
              { id: "printers", label: "PRINTERS" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`cursor-pointer py-2 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
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
                <h3 className="text-lg font-semibold text-black">
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
                      className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
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
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label
                      htmlFor="outOfStock"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      Product out of stock
                    </label>
                  </div>
                </div>
              </div>

              {/* Basic Product Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black">
                  Basic Product Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomInput
                    label="NAME *"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    inputClasses="focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter product name"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ASSOCIATED CATEGORY *
                    </label>
                    <CustomSelect
                      options={getCategoryOptions()}
                      value={formData.categoryId}
                      onChange={async (value: string) => {
                        // Update form data first
                        setFormData((prev) => ({
                          ...prev,
                          categoryId: value,
                          subcategoryId: "",
                        }));

                        // Handle subcategories based on selection
                        if (value && onFetchSubcategories) {
                          await onFetchSubcategories(value);
                        } else if (onClearSubcategories) {
                          onClearSubcategories();
                        }
                      }}
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
                      placeholder={
                        !formData.categoryId
                          ? "Select a category first"
                          : "Select subcategory"
                      }
                      portalClassName="product-subcategory-dropdown-portal"
                      disabled={!formData.categoryId}
                    />
                  </div>
                </div>
                {/* Product Image Upload */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PRODUCT IMAGE
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-orange-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 min-h-[150px] flex items-center justify-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {imagePreview ? (
                      <div className="flex flex-col items-center">
                        <div className="relative mb-2">
                          <img
                            crossOrigin="anonymous"
                            src={imagePreview}
                            alt="Product Preview"
                            className="w-48 h-32 object-cover rounded-lg shadow-md"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering file input
                              handleRemoveProductImage();
                            }}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                          >
                            <CrossIcon className="size-4 text-gray-600 hover:text-gray-800" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-500 text-center">
                          Click to change
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <ImgIcon className="size-12 mb-2" />
                        <p className="text-sm font-medium">
                          Upload product image
                        </p>
                        <p className="text-xs">PNG, JPG up to 2MB</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DESCRIPTION
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
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
                <h3 className="text-lg font-semibold text-black">
                  Pricing and Financials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <CustomInput
                    label="PRICE *"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    inputClasses="focus:ring-orange-500 focus:border-orange-500 pl-8"
                    placeholder="0"
                    step="0.01"
                    min="0"
                    preLabel="€"
                    required
                    otherClasses="relative"
                  />
                  <CustomInput
                    label="PRIORITY"
                    name="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                    inputClasses="focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0"
                    min="0"
                    required
                  />
                  <CustomInput
                    label="TAX (%)"
                    name="tax"
                    type="number"
                    value={formData.tax}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tax: parseInt(e.target.value) || 0,
                      })
                    }
                    inputClasses="focus:ring-orange-500 focus:border-orange-500 pr-8"
                    placeholder="10"
                    min="0"
                    max="100"
                    required
                    otherClasses="relative"
                    postLabel="%"
                    secLabelClasses="right-3 top-2"
                  />
                  <CustomInput
                    label="DISCOUNT"
                    name="discount"
                    type="number"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: parseFloat(e.target.value) || 0,
                      })
                    }
                    inputClasses="focus:ring-orange-500 focus:border-orange-500 pl-8"
                    placeholder="0"
                    step="0.01"
                    min="0"
                    required
                    otherClasses="relative"
                    preLabel="€"
                  />
                </div>

                {/* Price Breakdown Display */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Subtotal:
                      </span>
                      <span className="text-sm font-semibold text-black">
                        €{calculatePriceBreakdown().subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Tax ({formData.tax || 0}%):
                      </span>
                      <span className="text-sm font-semibold text-black">
                        €{calculatePriceBreakdown().taxAmount.toFixed(2)}
                      </span>
                    </div>
                    {formData.discount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Discount:
                        </span>
                        <span className="text-sm font-semibold text-red-600">
                          -€
                          {calculatePriceBreakdown().discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-black">
                          Total:
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          €{calculatePriceBreakdown().total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Attributes */}
              <div className="space-y-4 mb-4">
                <h3 className="text-lg font-semibold text-black">
                  Product Attributes
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    {
                      key: "isDrink",
                      label: "It is a drink",
                    },
                    {
                      key: "isByWeight",
                      label: "Product by weight",
                    },
                    {
                      key: "isPerDiner",
                      label: "Product per diner",
                    },
                    {
                      key: "isOutstanding",
                      label: "Outstanding",
                    },
                    {
                      key: "isPlus18",
                      label: "Product +18",
                    },
                    {
                      key: "isForMenu",
                      label: "Is for Menu",
                    },
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
                        className="h-4 w-4 accent-orange-600 cursor-pointer"
                      />
                      <label
                        htmlFor={attr.key}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {attr.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "variants" && (
            <div className="space-y-6">
              {/* Assign Variants Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    ASSIGN VARIANTS
                  </label>
                </div>

                {/* Variant Selection Dropdown */}
                <CustomSelect
                  options={getVariantOptions()}
                  value={selectedVariant}
                  onChange={(value: string) => handleVariantChange(value)}
                  placeholder="Select a variant"
                  portalClassName="variant-dropdown-portal"
                />

                {/* Selected Variants and their Items */}
                {selectedVariant && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      Variant Items and Pricing
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
                          <h5 className="font-medium text-black">
                            {variant.name !== ""
                              ? variant.name
                              : variant.items.map((i) => i.name).join("-")}
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {variant.items.map((item) => {
                            return (
                              <div
                                key={item.id}
                                className="flex items-center gap-2"
                              >
                                <CustomInput
                                  type="number"
                                  value={variantPrices[item.id] || 0}
                                  onChange={(e) =>
                                    handleVariantItemPriceChange(
                                      item.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  inputClasses="pl-8"
                                  otherClasses="relative w-full"
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                  preLabel="€"
                                  label={item.name}
                                  name="price"
                                />
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
              {/* <div className="space-y-4">
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
                </div>
              </div> */}

              {/* Select Add-ons Page */}
              {showAddons && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                      SELECT ADD-ONS PAGE
                    </label>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {addonPages.map((page, index) => (
                      <div key={page.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setSelectedAddonPage(page.pageNo)}
                          className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            selectedAddonPage === page.pageNo
                              ? "bg-orange-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {index + 1}
                        </button>
                        {/* Show remove button only on added pages (not page 1) */}
                        {index > 0 && (
                          <CustomButton
                            variant="red"
                            label="×"
                            type="button"
                            onClick={() => removeAddonPage(page.pageNo)}
                            className="absolute -top-2 -right-2 size-5 !rounded-full !p-0 text-xs"
                          />
                        )}
                      </div>
                    ))}

                    {/* Add New Page Button */}
                    {canAddNewPage() && (
                      <CustomButton
                        type="button"
                        onClick={addAddonPage}
                        variant="transparent"
                        label="Add Page"
                        Icon={<AddIcon />}
                        className="border-2 border-dashed border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-600"
                      />
                    )}
                  </div>

                  {/* Page Setup */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        PAGE {selectedAddonPage} SETUP
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <CustomInput
                          type="number"
                          label="Minimum number of complements"
                          name="minComplements"
                          value={getCurrentPageData()?.minComplements || 0}
                          onChange={(e) =>
                            handleAddonPageSetupChange(
                              selectedAddonPage,
                              "minComplements",
                              parseInt(e.target.value) || 0
                            )
                          }
                          inputClasses={`focus:ring-orange-500 focus:border-orange-500 ${validationErrors[selectedAddonPage] ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
                          placeholder="0"
                          min="0"
                          otherClasses="w-full"
                        />
                        {validationErrors[selectedAddonPage] && (
                          <p className="text-red-500 text-xs mt-1">
                            {validationErrors[selectedAddonPage]}
                          </p>
                        )}
                      </div>
                      <div>
                        <CustomInput
                          type="number"
                          label="Maximum number of complements"
                          name="maxComplements"
                          value={getCurrentPageData()?.maxComplements || 0}
                          onChange={(e) =>
                            handleAddonPageSetupChange(
                              selectedAddonPage,
                              "maxComplements",
                              parseInt(e.target.value) || 0
                            )
                          }
                          inputClasses={`focus:ring-orange-500 focus:border-orange-500 ${validationErrors[selectedAddonPage] ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
                          placeholder="0"
                          min="0"
                          otherClasses="w-full"
                        />
                      </div>
                      {/* <div>
                        <CustomInput
                          type="number"
                          label="Number of free add-ons"
                          name="freeAddons"
                          value={getCurrentPageData().freeAddons}
                          onChange={(e) =>
                            handleAddonPageSetupChange(
                              selectedAddonPage,
                              "freeAddons",
                              parseInt(e.target.value) || 0
                            )
                          }
                          inputClasses="focus:ring-orange-500 focus:border-orange-500"
                          placeholder="0"
                          min="0"
                          otherClasses="w-full"
                        />
                      </div> */}
                    </div>
                  </div>
                </div>
              )}

              {/* Add Plugin Group for Current Page */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    ADD PLUGIN GROUP FOR PAGE {selectedAddonPage}
                  </label>
                  {getCurrentPageData()?.selectedGroup && (
                    <span className="text-sm text-gray-500">
                      (Available items:{" "}
                      {getGroupItemCount(getCurrentPageData()?.selectedGroup)})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {getAvailableGroupsForPage(selectedAddonPage).map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() =>
                        handlePagePluginGroupChange(selectedAddonPage, group.id)
                      }
                      className={`cursor-pointer relative px-4 py-3 rounded-md text-sm font-medium text-white transition-colors duration-200 ${getPluginGroupColorClasses(group.color)} ${
                        getCurrentPageData()?.selectedGroup === group.id
                          ? `ring-2 ${getPluginGroupRingClasses(group.color)} ring-offset-2`
                          : ""
                      }`}
                    >
                      {group.name}
                      {getCurrentPageData()?.selectedGroup === group.id && (
                        <div
                          className={`absolute -top-3 -right-2 w-5 h-5 ${getPluginGroupCheckmarkClasses(group.color)} rounded-full flex items-center justify-center`}
                        >
                          <CheckMark className="w-3 h-3 text-white" />
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
              <h3 className="text-lg font-semibold text-black">Printers</h3>
              <p className="text-gray-600">Configure printer settings here.</p>
              <div className="grid grid-cols-4 gap-4">
                {printers.map((printer) => (
                  <div
                    key={printer.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md"
                  >
                    <input
                      type="checkbox"
                      id={`printer-${printer.id}`}
                      checked={selectedPrinterIds.includes(printer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPrinterIds([
                            ...selectedPrinterIds,
                            printer.id,
                          ]);
                        } else {
                          setSelectedPrinterIds(
                            selectedPrinterIds.filter((id) => id !== printer.id)
                          );
                        }
                      }}
                      className="size-6 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label
                      htmlFor={`printer-${printer.id}`}
                      className="text-sm font-medium text-black cursor-pointer max-w-36 min-w-36"
                    >
                      {printer.displayName}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-4">
            <CustomButton
              type="button"
              onClick={onClose}
              variant="secondary"
              label="Cancel"
            />
            <CustomButton
              type="submit"
              disabled={isSubmitting}
              variant="orange"
              label={product ? "Save Changes" : "Create Product"}
              isLoading={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export { ProductModal };
