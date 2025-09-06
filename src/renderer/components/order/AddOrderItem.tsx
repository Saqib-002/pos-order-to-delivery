import { Item } from "@/types/order";
import { MenuItem } from "@/types/Menu";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { IngredientSelector } from "./IngredientSelector";
const AddOrderItem = ({
  items,
  setItems,
  token,
}: {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  token: string | null;
}) => {
  const [newItem, setNewItem] = useState({ name: "", quantity: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    item: Item;
    index: number;
  } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  // Search for menu items
  const searchMenuItems = async (searchTerm: string) => {
    if (!token || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await (window as any).electronAPI.getMenuItemsByName(
        token,
        searchTerm
      );
      if (response.status) {
        setSearchResults(response.data);
        setShowSearchResults(true);
      } else {
        console.error("Search failed:", response.error);
        toast.error(
          `Failed to search menu items: ${response.error || "Unknown error"}`
        );
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(
        `Error searching menu items: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchMenuItems(searchTerm);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, token]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchResults]);

  const handleAddItemWithIngredients = (
    menuItem: MenuItem,
    selectedIngredients: string[]
  ) => {
    // Filter out empty ingredients
    const filteredIngredients = selectedIngredients.filter(
      (ingredient) => ingredient.trim() !== ""
    );

    const itemToAdd: Item = {
      name: menuItem.name,
      quantity: 1,
      ingredients:
        filteredIngredients.length > 0 ? filteredIngredients : undefined,
      price: menuItem.price,
      category: menuItem.category,
    };

    setItems([...items, itemToAdd]);
    setSearchTerm("");
    setShowSearchResults(false);
    setSelectedMenuItem(null);
  };

  const handleIngredientConfirm = (selectedIngredients: string[]) => {
    if (selectedMenuItem) {
      handleAddItemWithIngredients(selectedMenuItem, selectedIngredients);
    }
    setShowIngredientSelector(false);
  };

  const handleEditItem = async (item: Item, index: number) => {
    setEditingItem({ item, index });
    setSearchTerm(item.name);

    // Try to fetch the original menu item to get all available ingredients
    try {
      if (token) {
        const response = await (window as any).electronAPI.getMenuItemsByName(
          token,
          item.name
        );
        if (response.status && response.data && response.data.length > 0) {
          // Find the exact match or use the first result
          const originalMenuItem =
            response.data.find(
              (menuItem: MenuItem) =>
                menuItem.name.toLowerCase() === item.name.toLowerCase()
            ) || response.data[0];

          setSelectedMenuItem(originalMenuItem);
          setShowIngredientSelector(true);
        } else {
          // Fallback to mock menu item if we can't find the original
          const mockMenuItem: MenuItem = {
            id: "0",
            name: item.name,
            description: "",
            price: item.price || 0,
            category: item.category || "",
            ingredients: item.ingredients || [],
            isAvailable: true,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setSelectedMenuItem(mockMenuItem);
          setShowIngredientSelector(true);
        }
      } else {
        // If no token, create mock item and show selector
        const mockMenuItem: MenuItem = {
          id: "0",
          name: item.name,
          description: "",
          price: item.price || 0,
          category: item.category || "",
          ingredients: item.ingredients || [],
          isAvailable: true,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSelectedMenuItem(mockMenuItem);
        setShowIngredientSelector(true);
      }
    } catch (error) {
      console.error("Error fetching original menu item:", error);
      // Fallback to mock menu item
      const mockMenuItem: MenuItem = {
        id: "0",
        name: item.name,
        description: "",
        price: item.price || 0,
        category: item.category || "",
        ingredients: item.ingredients || [],
        isAvailable: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSelectedMenuItem(mockMenuItem);
      setShowIngredientSelector(true);
    }
  };

  const handleUpdateItem = (selectedIngredients: string[]) => {
    if (editingItem) {
      // Filter out empty ingredients
      const filteredIngredients = selectedIngredients.filter(
        (ingredient) => ingredient.trim() !== ""
      );

      const updatedItems = [...items];
      updatedItems[editingItem.index] = {
        ...editingItem.item,
        ingredients:
          filteredIngredients.length > 0 ? filteredIngredients : undefined,
      };
      setItems(updatedItems);
      setEditingItem(null);
      setSearchTerm("");
    }
    setShowIngredientSelector(false);
  };

  const handleSelectMenuItem = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setSearchTerm(menuItem.name);
    setShowSearchResults(false);

    // If the item has ingredients, show the ingredient selector
    if (
      menuItem.ingredients &&
      menuItem.ingredients.length > 0 &&
      menuItem.ingredients.some((ing) => ing.trim() !== "")
    ) {
      setShowIngredientSelector(true);
    } else {
      // If no ingredients, add directly with quantity 1
      handleAddItemWithIngredients(menuItem, []);
    }
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  return (
    <div className="my-6">
      <h3 className="text-lg mb-2 font-semibold">Items</h3>

      {/* Ingredient Selector Modal */}
      <IngredientSelector
        menuItem={selectedMenuItem}
        isOpen={showIngredientSelector}
        onClose={() => {
          setShowIngredientSelector(false);
          setEditingItem(null);
        }}
        onConfirm={editingItem ? handleUpdateItem : handleIngredientConfirm}
        editingIngredients={editingItem?.item.ingredients}
      />
      <div className="flex flex-col gap-2 mb-4">
        {items.map((item, index) => (
          <div
            className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            key={index}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.name}</div>
                {item.price && (
                  <div className="text-sm text-gray-600">
                    ${item.price} each
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Quantity Controls */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.quantity > 1) {
                        const updatedItems = [...items];
                        updatedItems[index].quantity -= 1;
                        setItems(updatedItems);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 cursor-pointer"
                    disabled={item.quantity <= 1}
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <span className="w-8 text-center font-medium text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedItems = [...items];
                      updatedItems[index].quantity += 1;
                      setItems(updatedItems);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
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
                  </button>
                </div>

                {/* Edit Button - Only show if item has ingredients */}
                {item.ingredients &&
                  item.ingredients.length > 0 &&
                  item.ingredients.some((ing: string) => ing.trim() !== "") && (
                    <button
                      type="button"
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200 cursor-pointer"
                      onClick={() => handleEditItem(item, index)}
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
                    </button>
                  )}

                {/* Delete Button */}
                <button
                  type="button"
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 cursor-pointer"
                  onClick={() => removeItem(index)}
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
                </button>
              </div>
            </div>
            {item.ingredients && item.ingredients.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Ingredients:</div>
                <div className="flex flex-wrap gap-1">
                  {item.ingredients.map((ingredient, ingIndex) => (
                    <span
                      key={ingIndex}
                      className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="relative" ref={searchRef}>
        <label
          htmlFor="item_name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Search Menu Item
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for menu items..."
            id="item_name"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setNewItem({
                ...newItem,
                name: e.target.value,
              });
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-200 placeholder-gray-400"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((menuItem) => (
              <div
                key={menuItem.id}
                onClick={() => handleSelectMenuItem(menuItem)}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      {menuItem.name}
                    </div>
                    {menuItem.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {menuItem.description}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      {menuItem.category} • ${menuItem.price}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-indigo-600">
                      ${menuItem.price}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSearchResults &&
          searchResults.length === 0 &&
          !isSearching &&
          searchTerm.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-md shadow-lg p-3">
              <div className="text-gray-500 text-sm">
                No menu items found for "{searchTerm}"
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default AddOrderItem;
