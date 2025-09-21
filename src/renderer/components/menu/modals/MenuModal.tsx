import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CustomSelect } from "../../ui/CustomSelect";

interface MenuPage {
  id: string;
  name: string;
  description: string;
  products: any[];
}

interface MenuPageAssociation {
  id: string;
  pageId: string;
  pageName: string;
  minimum: number;
  maximum: number;
  priority: number;
  kitchenPriority: string;
  multiple: string;
}

interface Menu {
  id: string;
  name: string;
  subcategoryId: string;
  description: string;
  price: number;
  priority: number;
  tax: number;
  discount: number;
  outstanding: boolean;
  menuPageAssociations: MenuPageAssociation[];
}

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMenu: Menu | null;
  token: string;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingMenu,
  token,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    subcategoryId: "",
    description: "",
    price: 0,
    priority: 0,
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
    pageId: "",
    minimum: 1,
    maximum: 1,
    priority: 0,
    kitchenPriority: "Priority 1",
    multiple: "No",
  });

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
        toast.error("Unable to get subcategories");
        return;
      }

      const subcategoryOptions = res.data.map((subcat: any) => ({
        value: subcat.id,
        label: subcat.name,
      }));
      setSubcategories(subcategoryOptions);
    } catch (error) {
      toast.error("Failed to fetch subcategories");
    }
  };

  // Fetch menu pages
  const fetchMenuPages = async () => {
    try {
      const res = await (window as any).electronAPI.getMenuPages(token);
      if (!res.status) {
        toast.error("Unable to get menu pages");
        return;
      }
      setMenuPages(res.data);

      // Filter out already added menu pages
      const addedPageIds = menuPageAssociations.map((assoc) => assoc.pageId);
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
          label: "No menu pages available to add",
          disabled: true,
        });
      }

      setAvailableMenuPages(pageOptions);
    } catch (error) {
      toast.error("Failed to fetch menu pages");
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
          pageId: assoc.menuPageId,
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
        price: editingMenu.price,
        priority: editingMenu.priority,
        tax: editingMenu.tax,
        discount: editingMenu.discount,
        outstanding: editingMenu.outstanding,
      });
      // Fetch existing menu page associations from database
      fetchMenuPageAssociations(editingMenu.id);
    } else {
      setFormData({
        name: "",
        subcategoryId: "",
        description: "",
        price: 0,
        priority: 0,
        tax: 0,
        discount: 0,
        outstanding: false,
      });
      setMenuPageAssociations([]);
    }
    setNewPageAssociation({
      pageId: "",
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
    setNewPageAssociation((prev) => ({
      ...prev,
      [name]:
        name === "minimum" || name === "maximum" || name === "priority"
          ? Number(value)
          : value,
    }));
  };

  const handlePageSelect = (value: string) => {
    setNewPageAssociation((prev) => ({
      ...prev,
      pageId: value,
    }));
  };

  const handleAddPageAssociation = () => {
    if (!newPageAssociation.pageId) {
      toast.error("Please select a menu page");
      return;
    }

    const selectedOption = availableMenuPages.find(
      (option) => option.value === newPageAssociation.pageId
    );
    if (!selectedOption || selectedOption.disabled) {
      toast.error("No menu pages available to add");
      return;
    }

    const selectedPage = menuPages.find(
      (page) => page.id === newPageAssociation.pageId
    );
    if (!selectedPage) {
      toast.error("Selected menu page not found");
      return;
    }

    const association: MenuPageAssociation = {
      id: `temp_${Date.now()}`,
      pageId: newPageAssociation.pageId,
      pageName: selectedPage.name,
      minimum: newPageAssociation.minimum,
      maximum: newPageAssociation.maximum,
      priority: newPageAssociation.priority,
      kitchenPriority: newPageAssociation.kitchenPriority,
      multiple: newPageAssociation.multiple,
    };

    setMenuPageAssociations((prev) => [...prev, association]);
    setNewPageAssociation({
      pageId: "",
      minimum: 1,
      maximum: 1,
      priority: 0,
      kitchenPriority: "Priority 1",
      multiple: "No",
    });
  };

  const handleDeletePageAssociation = (associationId: string) => {
    setMenuPageAssociations((prev) =>
      prev.filter((assoc) => assoc.id !== associationId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a menu name");
      return;
    }

    if (!formData.subcategoryId) {
      toast.error("Please select a subcategory");
      return;
    }

    if (formData.description && formData.description.length > 150) {
      toast.error("Description must be 150 characters or less");
      return;
    }

    if (menuPageAssociations.length === 0) {
      toast.error("Please add at least one menu page to the menu");
      return;
    }

    try {
      if (editingMenu) {
        // Update existing menu
        const res = await (window as any).electronAPI.updateMenu(
          token,
          editingMenu.id,
          formData
        );
        if (!res.status) {
          toast.error("Failed to update menu");
          return;
        }

        // Get existing menu page associations from database
        const existingAssociationsRes = await (
          window as any
        ).electronAPI.getMenuPageAssociations(token, editingMenu.id);
        const existingAssociations = existingAssociationsRes.status
          ? existingAssociationsRes.data
          : [];

        // Find associations to remove (exist in DB but not in current associations)
        const currentAssociationIds = menuPageAssociations
          .filter((assoc) => !assoc.id.startsWith("temp_"))
          .map((assoc) => assoc.id);
        const associationsToRemove = existingAssociations.filter(
          (existing: any) => !currentAssociationIds.includes(existing.id)
        );

        // Remove deleted associations
        for (const associationToRemove of associationsToRemove) {
          await (window as any).electronAPI.removeMenuPageAssociation(
            token,
            associationToRemove.id
          );
        }

        // Add new associations
        for (const association of menuPageAssociations) {
          if (association.id.startsWith("temp_")) {
            // New association - add to menu
            await (window as any).electronAPI.addMenuPageAssociation(
              token,
              editingMenu.id,
              association.pageId,
              association.pageName,
              association.minimum,
              association.maximum,
              association.priority,
              association.kitchenPriority,
              association.multiple
            );
          }
        }
      } else {
        // Create new menu
        const res = await (window as any).electronAPI.createMenu(
          token,
          formData
        );
        if (!res.status) {
          toast.error("Failed to create menu");
          return;
        }

        // Add menu page associations
        for (const association of menuPageAssociations) {
          await (window as any).electronAPI.addMenuPageAssociation(
            token,
            res.data.id,
            association.pageId,
            association.pageName,
            association.minimum,
            association.maximum,
            association.priority,
            association.kitchenPriority,
            association.multiple
          );
        }
      }

      toast.success(
        editingMenu ? "Menu updated successfully" : "Menu created successfully"
      );
      onSuccess();
    } catch (error) {
      toast.error("Failed to save menu");
    }
  };

  const handleEliminate = async () => {
    if (window.confirm("Are you sure you want to delete this menu?")) {
      try {
        const res = await (window as any).electronAPI.deleteMenu(
          token,
          editingMenu!.id
        );
        if (!res.status) {
          toast.error("Failed to delete menu");
          return;
        }
        toast.success("Menu deleted successfully");
        onSuccess();
      } catch (error) {
        toast.error("Failed to delete menu");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 uppercase">
              {editingMenu ? "EDIT MENU" : "CREATE MENU"}
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
            {/* Basic Information Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                BASIC INFORMATION
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NAME
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter menu name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ASSOCIATED SUBCATEGORY
                  </label>
                  <CustomSelect
                    options={subcategories}
                    value={formData.subcategoryId}
                    onChange={handleSubcategorySelect}
                    placeholder="Select subcategory"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DESCRIPTION
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Write a description (Max 150 characters)"
                  rows={3}
                  maxLength={150}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/150 characters
                </p>
              </div>
            </div>

            {/* Financial Details Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                FINANCIAL DETAILS
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PRICE
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">
                      €
                    </span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PRIORITY
                  </label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
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
                      name="tax"
                      value={formData.tax}
                      onChange={handleInputChange}
                      className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      max="100"
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
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Attributes Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                VISUAL ATTRIBUTES
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
                    OUTSTANDING
                  </span>
                </label>
              </div>
            </div>

            {/* Add Pages Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ADD PAGES
              </h3>
              <div className="flex items-end gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SELECT MENU PAGE
                  </label>
                  <CustomSelect
                    options={availableMenuPages}
                    value={newPageAssociation.pageId}
                    onChange={handlePageSelect}
                    placeholder={
                      availableMenuPages.length === 1 &&
                      availableMenuPages[0].disabled
                        ? "No menu pages available"
                        : "Select a menu page"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MINIMUM
                  </label>
                  <input
                    type="number"
                    name="minimum"
                    value={newPageAssociation.minimum}
                    onChange={handleNewPageAssociationChange}
                    className="w-full px-2 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MAXIMUM
                  </label>
                  <input
                    type="number"
                    name="maximum"
                    value={newPageAssociation.maximum}
                    onChange={handleNewPageAssociationChange}
                    className="w-full px-2 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PRIORITY
                  </label>
                  <input
                    type="number"
                    name="priority"
                    value={newPageAssociation.priority}
                    onChange={handleNewPageAssociationChange}
                    className="w-full px-2 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KITCHEN PRIORITY
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
                    placeholder="Select priority"
                    className="w-full"
                    maxHeight="max-h-36"
                  />
                </div>

                <div className="w-24">
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
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddPageAssociation}
                    className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition-colors duration-200"
                  >
                    ADD
                  </button>
                </div>
              </div>

              {/* Menu Page Associations Table */}
              {menuPageAssociations.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PAGE
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MINIMUM
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MAXIMUM
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PRIORITY
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          KITCHEN PRIORITY
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MULTIPLE
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {menuPageAssociations.map((association) => (
                        <tr key={association.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">
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
                                      ? { ...assoc, minimum: value }
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
                                      ? { ...assoc, maximum: value }
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
                                      ? { ...assoc, priority: value }
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
                                      ? { ...assoc, kitchenPriority: value }
                                      : assoc
                                  )
                                );
                              }}
                              className="w-32"
                              maxHeight="max-h-36"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <CustomSelect
                              options={multipleOptions}
                              value={association.multiple}
                              onChange={(value) => {
                                setMenuPageAssociations((prev) =>
                                  prev.map((assoc) =>
                                    assoc.id === association.id
                                      ? { ...assoc, multiple: value }
                                      : assoc
                                  )
                                );
                              }}
                              className="w-20"
                              maxHeight="max-h-36"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleDeletePageAssociation(association.id)
                              }
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

              {editingMenu && (
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
