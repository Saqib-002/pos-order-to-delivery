import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CustomSelect } from "../../ui/CustomSelect";
import CrossIcon from "../../../assets/icons/cross.svg?react";
import DeleteIcon from "../../../assets/icons/delete.svg?react";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";

interface MenuPage {
    id: string;
    name: string;
    description: string;
    products: any[];
}

interface MenuPageAssociation {
    id: string;
    menuPageId: string;
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
    token: string | null;
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
        menuPageId: "",
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
            const res = await (window as any).electronAPI.getAllSubcategories(
                token
            );
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
            const res = await (
                window as any
            ).electronAPI.getMenuPageAssociations(token, menuId);
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
            menuPageId: value,
        }));
    };

    const handleAddPageAssociation = () => {
        if (!newPageAssociation.menuPageId) {
            toast.error("Please select a menu page");
            return;
        }

        const selectedOption = availableMenuPages.find(
            (option) => option.value === newPageAssociation.menuPageId
        );
        if (!selectedOption || selectedOption.disabled) {
            toast.error("No menu pages available to add");
            return;
        }

        const selectedPage = menuPages.find(
            (page) => page.id === newPageAssociation.menuPageId
        );
        if (!selectedPage) {
            toast.error("Selected menu page not found");
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
                const res = await (window as any).electronAPI.updateMenu(
                    token,
                    editingMenu.id,
                    formData,
                    menuPageAssociations
                );
                console.log(res,menuPageAssociations);
                if (!res.status) {
                    toast.error("Failed to update menu");
                    return;
                }
            } else {
                const res = await (window as any).electronAPI.createMenu(
                    token,
                    formData,
                    menuPageAssociations
                );
                console.log(res);
                if (!res.status) {
                    toast.error("Failed to create menu");
                    return;
                }
            }

            toast.success(
                editingMenu
                    ? "Menu updated successfully"
                    : "Menu created successfully"
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
                            className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors duration-200"
                        >
                            <CrossIcon className="size-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Basic Information Section */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                BASIC INFORMATION
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomInput
                                    label="NAME"
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Enter menu name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    inputClasses="focus:ring-orange-500"
                                />

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
                                <CustomInput
                                    label="PRICE"
                                    name="price"
                                    type="number"
                                    required
                                    placeholder="Enter price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    inputClasses="focus:ring-orange-500 pl-8"
                                    preLabel="€"
                                />
                                <CustomInput
                                    label="PRIORITY"
                                    name="priority"
                                    type="number"
                                    required
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    min="0"
                                    inputClasses="focus:ring-orange-500"
                                />
                                <CustomInput
                                    label="TAX"
                                    name="tax"
                                    type="number"
                                    required
                                    value={formData.tax}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                    inputClasses="focus:ring-orange-500 pr-8"
                                    postLabel="%"
                                />
                                <CustomInput
                                    label="DISCOUNT"
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
                                        value={newPageAssociation.menuPageId}
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
                                <CustomInput label="MINIMUM" name="minimum" type="number" value={newPageAssociation.minimum} onChange={handleNewPageAssociationChange} min="1" inputClasses="focus:ring-orange-500" otherClasses="w-24"/>
                                <CustomInput label="MAXIMUM" name="maximum" type="number" value={newPageAssociation.maximum} onChange={handleNewPageAssociationChange} min="1" inputClasses="focus:ring-orange-500" otherClasses="w-24"/>
                                <CustomInput label="PRIORITY" name="priority" type="number" value={newPageAssociation.priority} onChange={handleNewPageAssociationChange} min="0" inputClasses="focus:ring-orange-500" otherClasses="w-24"/>

                                <div className="w-32">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        KITCHEN PRIORITY
                                    </label>
                                    <CustomSelect
                                        options={kitchenPriorityOptions}
                                        value={
                                            newPageAssociation.kitchenPriority
                                        }
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
                                    <CustomButton
                                        type="button"
                                        label="Add"
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
                                            {menuPageAssociations.map(
                                                (association) => (
                                                    <tr key={association.id}>
                                                        <td className="px-4 py-2 text-sm text-gray-900">
                                                            {
                                                                association.pageName
                                                            }
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    association.minimum
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const value =
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        );
                                                                    setMenuPageAssociations(
                                                                        (
                                                                            prev
                                                                        ) =>
                                                                            prev.map(
                                                                                (
                                                                                    assoc
                                                                                ) =>
                                                                                    assoc.id ===
                                                                                    association.id
                                                                                        ? {
                                                                                              ...assoc,
                                                                                              minimum:
                                                                                                  value,
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
                                                                value={
                                                                    association.maximum
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const value =
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        );
                                                                    setMenuPageAssociations(
                                                                        (
                                                                            prev
                                                                        ) =>
                                                                            prev.map(
                                                                                (
                                                                                    assoc
                                                                                ) =>
                                                                                    assoc.id ===
                                                                                    association.id
                                                                                        ? {
                                                                                              ...assoc,
                                                                                              maximum:
                                                                                                  value,
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
                                                                value={
                                                                    association.priority
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const value =
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        );
                                                                    setMenuPageAssociations(
                                                                        (
                                                                            prev
                                                                        ) =>
                                                                            prev.map(
                                                                                (
                                                                                    assoc
                                                                                ) =>
                                                                                    assoc.id ===
                                                                                    association.id
                                                                                        ? {
                                                                                              ...assoc,
                                                                                              priority:
                                                                                                  value,
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
                                                                options={
                                                                    kitchenPriorityOptions
                                                                }
                                                                value={
                                                                    association.kitchenPriority
                                                                }
                                                                onChange={(
                                                                    value
                                                                ) => {
                                                                    setMenuPageAssociations(
                                                                        (
                                                                            prev
                                                                        ) =>
                                                                            prev.map(
                                                                                (
                                                                                    assoc
                                                                                ) =>
                                                                                    assoc.id ===
                                                                                    association.id
                                                                                        ? {
                                                                                              ...assoc,
                                                                                              kitchenPriority:
                                                                                                  value,
                                                                                          }
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
                                                                options={
                                                                    multipleOptions
                                                                }
                                                                value={
                                                                    association.multiple
                                                                }
                                                                onChange={(
                                                                    value
                                                                ) => {
                                                                    setMenuPageAssociations(
                                                                        (
                                                                            prev
                                                                        ) =>
                                                                            prev.map(
                                                                                (
                                                                                    assoc
                                                                                ) =>
                                                                                    assoc.id ===
                                                                                    association.id
                                                                                        ? {
                                                                                              ...assoc,
                                                                                              multiple:
                                                                                                  value,
                                                                                          }
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
                                                                    handleDeletePageAssociation(
                                                                        association.id
                                                                    )
                                                                }
                                                                className="text-red-500 hover:text-red-700 cursor-pointer transition-colors duration-200"
                                                            >
                                                                <DeleteIcon className="size-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
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
                                    label="Keep"
                                    variant="yellow"
                                />
                                <CustomButton
                                    type="button"
                                    label="Close"
                                    variant="secondary"
                                    onClick={onClose}
                                />
                            </div>

                            {editingMenu && (
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
