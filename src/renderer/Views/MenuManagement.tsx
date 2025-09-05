import { useState, useEffect } from "react";
import { MenuItem } from "@/types/Menu";
import { toast } from "react-toastify";
import { CustomSelect } from "../components/ui/CustomSelect";

interface MenuManagementProps {
  token: string | null;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({ token }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    isAvailable: true,
    imageUrl: "",
    ingredients: [] as string[],
  });

  const [newIngredient, setNewIngredient] = useState("");

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, [token]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const items = await (window as any).electronAPI.getMenuItems(token);
      setMenuItems(items);
    } catch (error) {
      toast.error("Failed to fetch menu items");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await (window as any).electronAPI.getCategories(token);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!newItem.name.trim()) {
      toast.error("Please enter a menu item name");
      return;
    }
    if (!newItem.category) {
      toast.error("Please select a category");
      return;
    }
    if (newItem.price <= 0) {
      toast.error("Please enter a valid price greater than 0");
      return;
    }

    // Show form data in alert
    const formData = {
      name: newItem.name,
      description: newItem.description,
      price: newItem.price,
      category: newItem.category,
      isAvailable: newItem.isAvailable,
      imageUrl: newItem.imageUrl,
      ingredients: newItem.ingredients,
    };
    alert("Form Data:\n" + JSON.stringify(formData, null, 2));

    // try {
    //   const item = await (window as any).electronAPI.createMenuItem(
    //     token,
    //     newItem
    //   );
    //   setMenuItems([...menuItems, item]);
    //   setNewItem({
    //     name: "",
    //     description: "",
    //     price: 0,
    //     category: "",
    //     isAvailable: true,
    //     imageUrl: "",
    //     ingredients: [],
    //   });
    //   setIsAddModalOpen(false);
    //   setNewIngredient("");
    //   await fetchCategories(); // Refresh categories
    //   toast.success("Menu item added successfully");
    // } catch (error) {
    //   toast.error("Failed to add menu item");
    // }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Validate required fields
    if (!editingItem.name.trim()) {
      toast.error("Please enter a menu item name");
      return;
    }
    if (!editingItem.category) {
      toast.error("Please select a category");
      return;
    }
    if (editingItem.price <= 0) {
      toast.error("Please enter a valid price greater than 0");
      return;
    }

    try {
      const updatedItem = await (window as any).electronAPI.updateMenuItem(
        token,
        editingItem.id,
        editingItem
      );
      setMenuItems(
        menuItems.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        )
      );
      setEditingItem(null);
      setNewIngredient("");
      await fetchCategories(); // Refresh categories
      toast.success("Menu item updated successfully");
    } catch (error) {
      toast.error("Failed to update menu item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
      await (window as any).electronAPI.deleteMenuItem(token, id);
      setMenuItems(menuItems.filter((item) => item.id !== id));
      await fetchCategories(); // Refresh categories
      toast.success("Menu item deleted successfully");
    } catch (error) {
      toast.error("Failed to delete menu item");
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryOptions = () => [
    { value: "burgers", label: "Burgers" },
    { value: "pizza", label: "Pizza" },
    { value: "drinks", label: "Drinks" },
    { value: "desserts", label: "Desserts" },
    { value: "appetizers", label: "Appetizers" },
    { value: "salads", label: "Salads" },
    { value: "pasta", label: "Pasta" },
    { value: "sandwiches", label: "Sandwiches" },
  ];

  const getStatusOptions = () => [
    { value: "available", label: "Available" },
    { value: "unavailable", label: "Unavailable" },
  ];

  const addIngredient = (ingredient: string) => {
    const cleanIngredient = ingredient.trim();
    // Check for special characters (only allow letters, numbers, spaces, and basic punctuation)
    const specialCharRegex = /[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/;

    if (
      cleanIngredient &&
      !specialCharRegex.test(cleanIngredient) &&
      !newItem.ingredients.includes(cleanIngredient)
    ) {
      setNewItem({
        ...newItem,
        ingredients: [...newItem.ingredients, cleanIngredient],
      });
      setNewIngredient("");
    } else if (specialCharRegex.test(cleanIngredient)) {
      toast.error(
        "Ingredients cannot contain special characters like !@#$%^&*()_+=[]{};':\"\\|,.<>/?"
      );
    }
  };

  const removeIngredient = (index: number) => {
    setNewItem({
      ...newItem,
      ingredients: newItem.ingredients.filter((_, i) => i !== index),
    });
  };

  const addEditIngredient = (ingredient: string) => {
    const cleanIngredient = ingredient.trim();
    // Check for special characters (only allow letters, numbers, spaces, and basic punctuation)
    const specialCharRegex = /[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/;

    if (
      cleanIngredient &&
      !specialCharRegex.test(cleanIngredient) &&
      editingItem &&
      !editingItem.ingredients?.includes(cleanIngredient)
    ) {
      setEditingItem({
        ...editingItem,
        ingredients: [...(editingItem.ingredients || []), cleanIngredient],
      });
      setNewIngredient("");
    } else if (specialCharRegex.test(cleanIngredient)) {
      toast.error(
        "Ingredients cannot contain special characters like !@#$%^&*()_+=[]{};':\"\\|,.<>/?"
      );
    }
  };

  const removeEditIngredient = (index: number) => {
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        ingredients:
          editingItem.ingredients?.filter((_, i) => i !== index) || [],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[98%] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Menu Management
              </h2>
              <p className="text-gray-600 mt-1">
                Manage restaurant menu items and categories
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md cursor-pointer hover:scale-105"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Menu Item
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {menuItems.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {menuItems.filter((item) => item.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unavailable</p>
                <p className="text-2xl font-bold text-gray-900">
                  {menuItems.filter((item) => !item.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Menu Items ({filteredItems.length})
            </h3>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No menu items found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {menuItems.length === 0
                  ? "Get started by adding your first menu item."
                  : "Try adjusting your search or category filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingredients
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${item.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.isAvailable
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {item.description || "No description"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {item.ingredients && item.ingredients.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.ingredients.map((ingredient, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {ingredient}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">
                              No ingredients
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer hover:scale-105"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Add New Menu Item</h3>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewIngredient("");
                  }}
                  className="text-white hover:text-indigo-500 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
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
            <form onSubmit={handleAddItem} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="Item name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <CustomSelect
                    options={getCategoryOptions()}
                    value={newItem.category}
                    onChange={(value: string) =>
                      setNewItem({ ...newItem, category: value })
                    }
                    placeholder="Select category"
                    portalClassName="category-dropdown-portal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <CustomSelect
                    options={getStatusOptions()}
                    value={newItem.isAvailable ? "available" : "unavailable"}
                    onChange={(value: string) =>
                      setNewItem({
                        ...newItem,
                        isAvailable: value === "available",
                      })
                    }
                    placeholder="Select status"
                    portalClassName="status-dropdown-portal"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    rows={3}
                    placeholder="Item description"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={newItem.imageUrl}
                    onChange={(e) =>
                      setNewItem({ ...newItem, imageUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingredients
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newIngredient}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow letters, numbers, spaces, and basic punctuation
                          const specialCharRegex =
                            /[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/;
                          if (!specialCharRegex.test(value)) {
                            setNewIngredient(value);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addIngredient(newIngredient);
                          }
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                        placeholder="Add ingredient (press Enter to add)"
                      />
                      <button
                        type="button"
                        onClick={() => addIngredient(newIngredient)}
                        className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {newItem.ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newItem.ingredients.map((ingredient, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                          >
                            {ingredient}
                            <button
                              type="button"
                              onClick={() => removeIngredient(index)}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewIngredient("");
                  }}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium cursor-pointer hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Edit Menu Item</h3>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setNewIngredient("");
                  }}
                  className="text-white hover:text-indigo-500 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
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
            <form onSubmit={handleUpdateItem} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingItem.price}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <CustomSelect
                    options={getCategoryOptions()}
                    value={editingItem.category}
                    onChange={(value: string) =>
                      setEditingItem({ ...editingItem, category: value })
                    }
                    placeholder="Select category"
                    portalClassName="edit-category-dropdown-portal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <CustomSelect
                    options={getStatusOptions()}
                    value={
                      editingItem.isAvailable ? "available" : "unavailable"
                    }
                    onChange={(value: string) =>
                      setEditingItem({
                        ...editingItem,
                        isAvailable: value === "available",
                      })
                    }
                    placeholder="Select status"
                    portalClassName="edit-status-dropdown-portal"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingItem.description || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={editingItem.imageUrl || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        imageUrl: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingredients
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newIngredient}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow letters, numbers, spaces, and basic punctuation
                          const specialCharRegex =
                            /[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/;
                          if (!specialCharRegex.test(value)) {
                            setNewIngredient(value);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addEditIngredient(newIngredient);
                          }
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                        placeholder="Add ingredient (press Enter to add)"
                      />
                      <button
                        type="button"
                        onClick={() => addEditIngredient(newIngredient)}
                        className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {editingItem.ingredients &&
                      editingItem.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editingItem.ingredients.map((ingredient, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                            >
                              {ingredient}
                              <button
                                type="button"
                                onClick={() => removeEditIngredient(index)}
                                className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setNewIngredient("");
                  }}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium cursor-pointer hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
