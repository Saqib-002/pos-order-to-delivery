import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { CustomSelect } from "../../ui/CustomSelect";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import { CrossIcon, DeleteIcon, ImgIcon } from "@/renderer/public/Svg";
import { Menu, MenuPage, MenuPageAssociation } from "@/types/menuPages";
import { useTranslation } from "react-i18next";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMenu: Menu | null;
  token: string | null;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingMenu,
  token,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    subcategoryId: "",
    description: "",
    price: 0,
    priority: 0,
    imgUrl: "",
    tax: 0,
    discount: 0,
    outstanding: false,
  });

  const [subcategories, setSubcategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [menuPages, setMenuPages] = useState<MenuPage[]>([]);
  const [availableMenuPages, setAvailableMenuPages] = useState<
    { value: string; label: string; disabled?: boolean }[]
  >([]);
  const [menuPageAssociations, setMenuPageAssociations] = useState<
    MenuPageAssociation[]
  >([]);
  const [newPageAssociation, setNewPageAssociation] = useState({
    menuPageId: "",
    minimum: 1,
    maximum: 1,
    priority: 0,
    kitchenPriority: "Priority 1",
    multiple: "No",
  });
  const [selectedPageProductCount, setSelectedPageProductCount] =
    useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<{
    minimum?: string;
    maximum?: string;
  }>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kitchenPriorityOptions = [
    { value: "Priority 1", label: "Priority 1" },
    { value: "Priority 2", label: "Priority 2" },
    { value: "Priority 3", label: "Priority 3" },
    { value: "Priority 4", label: "Priority 4" },
    { value: "Priority 5", label: "Priority 5" },
  ];

  // Multiple options
  const multipleOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];

  // Fetch subcategories
  const fetchSubcategories = async () => {
    try {
      const res = await (window as any).electronAPI.getAllSubcategories(token);
      if (!res.status) {
        toast.error(t("menuComponents.modals.menuModal.errors.failedToFetch"));
        return;
      }

      const subcategoryOptions = res.data.map((subcat: any) => ({
        value: subcat.id,
        label: subcat.name,
      }));
      setSubcategories(subcategoryOptions);
    } catch (error) {
      toast.error(t("menuComponents.modals.menuModal.errors.failedToFetch"));
    }
  };

  // Fetch menu pages
  const fetchMenuPages = async () => {
    try {
      const res = await (window as any).electronAPI.getMenuPages(token);
      if (!res.status) {
        toast.error(t("menuComponents.modals.menuModal.errors.failedToFetch"));
        return;
      }
      setMenuPages(res.data);

      // Filter out already added menu pages
      const addedPageIds = menuPageAssociations.map(
        (assoc) => assoc.menuPageId
      );
      const availablePages = res.data.filter(
        (page: any) => !addedPageIds.includes(page.id)
      );

      const pageOptions = availablePages.map((page: any) => ({
        value: page.id,
        label: page.name,
      }));

      if (pageOptions.length === 0) {
        pageOptions.push({
          value: "",
          label: t("menuComponents.modals.menuModal.noMenuPagesAvailable"),
          disabled: true,
        });
      }

      setAvailableMenuPages(pageOptions);
    } catch (error) {
      toast.error(t("menuComponents.modals.menuModal.errors.failedToFetch"));
    }
  };

  // Fetch products for a specific menu page
  const fetchMenuPageProducts = async (menuPageId: string) => {
    try {
      const res = await (window as any).electronAPI.getMenuPageProducts(
        token,
        menuPageId
      );
      if (res.status && res.data) {
        setSelectedPageProductCount(res.data.length);
        return res.data.length;
      }
      setSelectedPageProductCount(0);
      return 0;
    } catch (error) {
      console.error("Failed to fetch menu page products:", error);
      setSelectedPageProductCount(0);
      return 0;
    }
  };

  // Fetch existing menu page associations
  const fetchMenuPageAssociations = async (menuId: string) => {
    try {
      const res = await (window as any).electronAPI.getMenuPageAssociations(
        token,
        menuId
      );
      if (res.status && res.data) {
        const existingAssociations = res.data.map((assoc: any) => ({
          id: assoc.id,
          menuPageId: assoc.menuPageId,
          pageName: assoc.pageName,
          minimum: assoc.minimum,
          maximum: assoc.maximum,
          priority: assoc.priority,
          kitchenPriority: assoc.kitchenPriority,
          multiple: assoc.multiple,
        }));
        setMenuPageAssociations(existingAssociations);
      }
    } catch (error) {
      console.error("Failed to fetch menu page associations:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubcategories();
      fetchMenuPages();
    }

    if (editingMenu) {
      setFormData({
        name: editingMenu.name,
        subcategoryId: editingMenu.subcategoryId,
        description: editingMenu.description || "",
        imgUrl: editingMenu.imgUrl || "",
        price: editingMenu.price,
        priority: editingMenu.priority,
        tax: editingMenu.tax,
        discount: editingMenu.discount,
        outstanding: editingMenu.outstanding,
      });
      // Fetch existing menu page associations from database
      fetchMenuPageAssociations(editingMenu.id);
      if (editingMenu.imgUrl) {
        setImagePreview(editingMenu.imgUrl);
      }
    } else {
      setFormData({
        name: "",
        subcategoryId: "",
        description: "",
        imgUrl: "",
        price: 0,
        priority: 0,
        tax: 0,
        discount: 0,
        outstanding: false,
      });
      setMenuPageAssociations([]);
      setImagePreview(null);
    }
    setNewPageAssociation({
      menuPageId: "",
      minimum: 1,
      maximum: 1,
      priority: 0,
      kitchenPriority: "Priority 1",
      multiple: "No",
    });
  }, [editingMenu, isOpen, token]);

  // Refetch menu pages when associations change
  useEffect(() => {
    if (isOpen) {
      fetchMenuPages();
    }
  }, [menuPageAssociations, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleSubcategorySelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      subcategoryId: value,
    }));
  };

  const handleNewPageAssociationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newValue =
      name === "minimum" || name === "maximum" || name === "priority"
        ? Number(value)
        : value;

    setNewPageAssociation((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Validate min/max values when they change
    if (name === "minimum" || name === "maximum") {
      const currentMin =
        name === "minimum" ? (newValue as number) : newPageAssociation.minimum;
      const currentMax =
        name === "maximum" ? (newValue as number) : newPageAssociation.maximum;
      const errors = validateMinMaxValues(currentMin, currentMax);
      setValidationErrors(errors);
    }
  };

  const handlePageSelect = async (value: string) => {
    setNewPageAssociation((prev) => ({
      ...prev,
      menuPageId: value,
    }));

    // Clear validation errors when page changes
    setValidationErrors({});

    // Fetch products for the selected page
    if (value) {
      await fetchMenuPageProducts(value);
    } else {
      setSelectedPageProductCount(0);
    }
  };

  // Validate min/max values against page product count
  const validateMinMaxValues = (minimum: number, maximum: number) => {
    const errors: { minimum?: string; maximum?: string } = {};

    if (selectedPageProductCount === 0) {
      return errors; // No validation if no products
    }

    if (minimum < 1) {
      errors.minimum = "Minimum must be at least 1";
    } else if (minimum > selectedPageProductCount) {
      errors.minimum = `Minimum cannot exceed the number of products in this page (${selectedPageProductCount})`;
    }

    if (maximum < 1) {
      errors.maximum = "Maximum must be at least 1";
    } else if (maximum > selectedPageProductCount) {
      errors.maximum = `Maximum cannot exceed the number of products in this page (${selectedPageProductCount})`;
    }

    if (minimum > maximum) {
      errors.minimum = "Minimum cannot be greater than maximum";
      errors.maximum = "Maximum cannot be less than minimum";
    }

    return errors;
  };

  const handleAddPageAssociation = () => {
    if (!newPageAssociation.menuPageId) {
      toast.error(t("menuComponents.modals.menuModal.errors.selectMenuPage"));
      return;
    }

    const selectedOption = availableMenuPages.find(
      (option) => option.value === newPageAssociation.menuPageId
    );
    if (!selectedOption || selectedOption.disabled) {
      toast.error(
        t("menuComponents.modals.menuModal.errors.noMenuPagesAvailable")
      );
      return;
    }

    const selectedPage = menuPages.find(
      (page) => page.id === newPageAssociation.menuPageId
    );
    if (!selectedPage) {
      toast.error(t("menuComponents.modals.menuModal.errors.menuPageNotFound"));
      return;
    }

    // Validate min/max values before adding
    const errors = validateMinMaxValues(
      newPageAssociation.minimum,
      newPageAssociation.maximum
    );
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error(
        t("menuComponents.modals.menuModal.errors.fixValidationErrors")
      );
      return;
    }

    const association: MenuPageAssociation = {
      id: `temp_${Date.now()}`,
      menuPageId: newPageAssociation.menuPageId,
      pageName: selectedPage.name,
      minimum: newPageAssociation.minimum,
      maximum: newPageAssociation.maximum,
      priority: newPageAssociation.priority,
      kitchenPriority: newPageAssociation.kitchenPriority,
      multiple: newPageAssociation.multiple,
    };

    setMenuPageAssociations((prev) => [...prev, association]);
    setNewPageAssociation({
      menuPageId: "",
      minimum: 1,
      maximum: 1,
      priority: 0,
      kitchenPriority: "Priority 1",
      multiple: "No",
    });
    setValidationErrors({});
    setSelectedPageProductCount(0);
  };

  const handleDeletePageAssociation = (associationId: string) => {
    setMenuPageAssociations((prev) =>
      prev.filter((assoc) => assoc.id !== associationId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("menuComponents.modals.menuModal.errors.nameRequired"));
      return;
    }

    if (!formData.subcategoryId) {
      toast.error(
        t("menuComponents.modals.menuModal.errors.subcategoryRequired")
      );
      return;
    }

    if (formData.description && formData.description.length > 150) {
      toast.error(
        t("menuComponents.modals.menuModal.errors.descriptionTooLong")
      );
      return;
    }

    if (menuPageAssociations.length === 0) {
      toast.error(
        t("menuComponents.modals.menuModal.errors.addMenuPageRequired")
      );
      return;
    }

    try {
      if (editingMenu) {
        const res = await (window as any).electronAPI.updateMenu(
          token,
          editingMenu.id,
          formData,
          menuPageAssociations
        );
        if (!res.status) {
          toast.error(
            t("menuComponents.modals.menuModal.errors.failedToUpdate")
          );
          return;
        }
      } else {
        const res = await (window as any).electronAPI.createMenu(
          token,
          formData,
          menuPageAssociations
        );
        if (!res.status) {
          toast.error(
            t("menuComponents.modals.menuModal.errors.failedToCreate")
          );
          return;
        }
      }

      toast.success(
        editingMenu
          ? t("menuComponents.modals.menuModal.success.updated")
          : t("menuComponents.modals.menuModal.success.created")
      );
      onSuccess();
    } catch (error) {
      toast.error(t("menuComponents.modals.menuModal.errors.failedToSave"));
    }
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

  const handleEliminate = async () => {
    if (window.confirm(t("menuComponents.modals.menuModal.confirmDelete"))) {
      try {
        const res = await (window as any).electronAPI.deleteMenu(
          token,
          editingMenu!.id
        );
        if (!res.status) {
          toast.error(
            t("menuComponents.modals.menuModal.errors.failedToDelete")
          );
          return;
        }
        toast.success(t("menuComponents.modals.menuModal.success.deleted"));
        onSuccess();
      } catch (error) {
        toast.error(t("menuComponents.modals.menuModal.errors.failedToDelete"));
      }
    }
  };
  const handleMenuImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveMenuImage = () => {
    setFormData({ ...formData, imgUrl: "" });
    setImagePreview(null);
    // Reset the file input to allow re-selection
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black uppercase">
              {editingMenu
                ? t("menuComponents.modals.menuModal.editTitle")
                : t("menuComponents.modals.menuModal.title")}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors duration-200"
            >
              <CrossIcon className="size-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                {t("menuComponents.modals.menuModal.basicInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomInput
                  label={t("menuComponents.modals.menuModal.menuName")}
                  name="name"
                  type="text"
                  required
                  placeholder={t(
                    "menuComponents.modals.menuModal.enterMenuName"
                  )}
                  value={formData.name}
                  onChange={handleInputChange}
                  inputClasses="focus:ring-orange-500"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("menuComponents.modals.menuModal.subcategory")}
                  </label>
                  <CustomSelect
                    options={subcategories}
                    value={formData.subcategoryId}
                    onChange={handleSubcategorySelect}
                    placeholder={t(
                      "menuComponents.modals.menuModal.selectSubcategory"
                    )}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("menuComponents.modals.menuModal.description")}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={t(
                    "menuComponents.modals.menuModal.writeDescription"
                  )}
                  rows={3}
                  maxLength={150}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/150 characters
                </p>
              </div>
            </div>
            {/* Menu Image Upload */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("menuComponents.modals.menuModal.image")}
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-orange-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 min-h-[150px] flex items-center justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMenuImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {imagePreview ? (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                      <img
                        crossOrigin="anonymous"
                        src={imagePreview}
                        alt="Menu Preview"
                        className="w-48 h-32 object-cover rounded-lg shadow-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering file input
                          handleRemoveMenuImage();
                        }}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                      >
                        <CrossIcon className="size-4 text-gray-600 hover:text-gray-800" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 text-center">
                      {t("menuComponents.modals.menuModal.clickToChange")}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <ImgIcon className="size-12 mb-2" />
                    <p className="text-sm font-medium">
                      {t("menuComponents.modals.menuModal.uploadImage")}
                    </p>
                    <p className="text-xs">PNG, JPG up to 2MB</p>
                  </div>
                )}
              </div>
            </div>
            {/* Financial Details Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                {t("menuComponents.modals.menuModal.financialDetails")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CustomInput
                  label={t("menuComponents.modals.menuModal.price")}
                  name="price"
                  type="number"
                  required
                  placeholder={t("menuComponents.modals.menuModal.enterPrice")}
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  inputClasses="focus:ring-orange-500 pl-8"
                  preLabel="€"
                />
                <CustomInput
                  label={t("menuComponents.modals.menuModal.priority")}
                  name="priority"
                  type="number"
                  required
                  value={formData.priority}
                  onChange={handleInputChange}
                  min="0"
                  inputClasses="focus:ring-orange-500"
                />
                <CustomInput
                  label={t("menuComponents.modals.menuModal.tax")}
                  name="tax"
                  type="number"
                  required
                  value={formData.tax}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  inputClasses="focus:ring-orange-500 pr-8"
                  otherClasses="relative"
                  postLabel="%"
                  secLabelClasses="right-3 top-2"
                />
                <CustomInput
                  label={t("menuComponents.modals.menuModal.discount")}
                  name="discount"
                  type="number"
                  required
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  inputClasses="focus:ring-orange-500 pl-8"
                  preLabel="€"
                />
              </div>
            </div>

            {/* Price Breakdown Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                {t("menuComponents.modals.menuModal.priceBreakdown")}
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {t("menuComponents.modals.menuModal.subtotal")}:
                    </span>
                    <span className="text-sm font-semibold text-black">
                      €{calculatePriceBreakdown().subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {t("menuComponents.modals.menuModal.tax")} (
                      {formData.tax || 0}%):
                    </span>
                    <span className="text-sm font-semibold text-black">
                      €{calculatePriceBreakdown().taxAmount.toFixed(2)}
                    </span>
                  </div>
                  {formData.discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {t("menuComponents.modals.menuModal.discount")}:
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        -€{calculatePriceBreakdown().discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-black">
                        {t("menuComponents.modals.menuModal.total")}:
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        €{calculatePriceBreakdown().total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Attributes Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                {t("menuComponents.modals.menuModal.visualAttributes")}
              </h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="outstanding"
                    checked={formData.outstanding}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {t("menuComponents.modals.menuModal.outstanding")}
                  </span>
                </label>
              </div>
            </div>

            {/* Add Pages Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                {t("menuComponents.modals.menuModal.addPages")}
              </h3>
              <div className="flex items-end gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("menuComponents.modals.menuModal.selectMenuPage")}
                    </label>
                    {newPageAssociation.menuPageId &&
                      selectedPageProductCount > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {t("menuComponents.modals.menuModal.products")}:{" "}
                          {selectedPageProductCount}
                        </span>
                      )}
                    {newPageAssociation.menuPageId &&
                      selectedPageProductCount === 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {t("menuComponents.modals.menuModal.products")}: 0
                        </span>
                      )}
                  </div>
                  <CustomSelect
                    options={availableMenuPages}
                    value={newPageAssociation.menuPageId}
                    onChange={handlePageSelect}
                    placeholder={
                      availableMenuPages.length === 1 &&
                      availableMenuPages[0].disabled
                        ? t(
                            "menuComponents.modals.menuModal.noMenuPagesAvailable"
                          )
                        : t("menuComponents.modals.menuModal.selectMenuPage")
                    }
                    className="w-full"
                    maxHeight="max-h-36"
                    disabled={
                      availableMenuPages.length === 1 &&
                      availableMenuPages[0].disabled
                    }
                  />
                </div>
                <div className="w-24">
                  <CustomInput
                    label={t("menuComponents.modals.menuModal.minimum")}
                    name="minimum"
                    type="number"
                    value={newPageAssociation.minimum}
                    onChange={handleNewPageAssociationChange}
                    min="1"
                    max={selectedPageProductCount || undefined}
                    inputClasses={`focus:ring-orange-500 ${validationErrors.minimum ? "border-red-500" : ""}`}
                    otherClasses="w-24"
                  />
                  {validationErrors.minimum && (
                    <div className="mt-1 text-xs text-red-600">
                      {validationErrors.minimum}
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <CustomInput
                    label={t("menuComponents.modals.menuModal.maximum")}
                    name="maximum"
                    type="number"
                    value={newPageAssociation.maximum}
                    onChange={handleNewPageAssociationChange}
                    min="1"
                    max={selectedPageProductCount || undefined}
                    inputClasses={`focus:ring-orange-500 ${validationErrors.maximum ? "border-red-500" : ""}`}
                    otherClasses="w-24"
                  />
                  {validationErrors.maximum && (
                    <div className="mt-1 text-xs text-red-600">
                      {validationErrors.maximum}
                    </div>
                  )}
                </div>
                <CustomInput
                  label={t("menuComponents.modals.menuModal.priority")}
                  name="priority"
                  type="number"
                  value={newPageAssociation.priority}
                  onChange={handleNewPageAssociationChange}
                  min="0"
                  inputClasses="focus:ring-orange-500"
                  otherClasses="w-24"
                />

                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("menuComponents.modals.menuModal.kitchenPriority")}
                  </label>
                  <CustomSelect
                    options={kitchenPriorityOptions}
                    value={newPageAssociation.kitchenPriority}
                    onChange={(value) =>
                      setNewPageAssociation((prev) => ({
                        ...prev,
                        kitchenPriority: value,
                      }))
                    }
                    placeholder={t(
                      "menuComponents.modals.menuModal.selectPriority"
                    )}
                    className="w-full"
                    maxHeight="max-h-36"
                  />
                </div>

                {/* <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MULTIPLE
                  </label>
                  <CustomSelect
                    options={multipleOptions}
                    value={newPageAssociation.multiple}
                    onChange={(value) =>
                      setNewPageAssociation((prev) => ({
                        ...prev,
                        multiple: value,
                      }))
                    }
                    placeholder="Select"
                    className="w-full"
                    maxHeight="max-h-36"
                  />
                </div> */}

                <div className="flex justify-end">
                  <CustomButton
                    type="button"
                    label={t("menuComponents.modals.menuModal.add")}
                    variant="orange"
                    onClick={handleAddPageAssociation}
                  />
                </div>
              </div>

              {/* Menu Page Associations Table */}
              {menuPageAssociations.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("menuComponents.modals.menuModal.page")}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("menuComponents.modals.menuModal.minimum")}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("menuComponents.modals.menuModal.maximum")}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("menuComponents.modals.menuModal.priority")}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("menuComponents.modals.menuModal.kitchenPriority")}
                        </th>
                        {/* <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MULTIPLE
                        </th> */}
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("menuComponents.modals.menuModal.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {menuPageAssociations.map((association) => (
                        <tr key={association.id}>
                          <td className="px-4 py-2 text-sm text-black">
                            {association.pageName}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={association.minimum}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setMenuPageAssociations((prev) =>
                                  prev.map((assoc) =>
                                    assoc.id === association.id
                                      ? {
                                          ...assoc,
                                          minimum: value,
                                        }
                                      : assoc
                                  )
                                );
                              }}
                              className="w-24 px-2 py-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                              min="1"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={association.maximum}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setMenuPageAssociations((prev) =>
                                  prev.map((assoc) =>
                                    assoc.id === association.id
                                      ? {
                                          ...assoc,
                                          maximum: value,
                                        }
                                      : assoc
                                  )
                                );
                              }}
                              className="w-24 px-2 py-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                              min="1"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={association.priority}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setMenuPageAssociations((prev) =>
                                  prev.map((assoc) =>
                                    assoc.id === association.id
                                      ? {
                                          ...assoc,
                                          priority: value,
                                        }
                                      : assoc
                                  )
                                );
                              }}
                              className="w-24 px-2 py-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <CustomSelect
                              options={kitchenPriorityOptions}
                              value={association.kitchenPriority}
                              onChange={(value) => {
                                setMenuPageAssociations((prev) =>
                                  prev.map((assoc) =>
                                    assoc.id === association.id
                                      ? {
                                          ...assoc,
                                          kitchenPriority: value,
                                        }
                                      : assoc
                                  )
                                );
                              }}
                              className="w-32"
                              maxHeight="max-h-36"
                            />
                          </td>
                          {/* <td className="px-4 py-2">
                            <CustomSelect
                              options={multipleOptions}
                              value={association.multiple}
                              onChange={(value) => {
                                setMenuPageAssociations((prev) =>
                                  prev.map((assoc) =>
                                    assoc.id === association.id
                                      ? {
                                          ...assoc,
                                          multiple: value,
                                        }
                                      : assoc
                                  )
                                );
                              }}
                              className="w-20"
                              maxHeight="max-h-36"
                            />
                          </td> */}
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleDeletePageAssociation(association.id)
                              }
                              className="text-red-500 hover:text-red-700 cursor-pointer transition-colors duration-200"
                            >
                              <DeleteIcon className="size-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <CustomButton
                  type="submit"
                  label={
                    editingMenu
                      ? t("menuComponents.modals.menuModal.update")
                      : t("menuComponents.modals.menuModal.create")
                  }
                  variant="yellow"
                />
                <CustomButton
                  type="button"
                  label={t("menuComponents.modals.menuModal.cancel")}
                  variant="secondary"
                  onClick={onClose}
                />
              </div>

              {editingMenu && (
                <CustomButton
                  type="button"
                  label={t("menuComponents.modals.menuModal.eliminate")}
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
