import React from "react";
import EditIcon from "../../assets/icons/edit.svg?react";
import DeleteIcon from "../../assets/icons/delete.svg?react";

interface BaseCardData {
  id: string;
  name?: string;
  itemCount?: number;
  color?: string;
  description?: string;
  price?: number;
  isAvailable?: boolean;
  groupName?: string;
  variantCount?: number;
}

interface UnifiedCardProps {
  data: BaseCardData;
  type:
    | "category"
    | "subcategory"
    | "product"
    | "group"
    | "variant"
    | "menuPage"
    | "menu";
  onEdit: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  showActions?: boolean;
}

const getColorClasses = (color: string | undefined, type: string) => {
  if (!color) {
    return "bg-gray-500 text-white border-gray-500";
  }
  const colorMap: { [key: string]: string } = {
    red: "bg-red-500 text-white border-red-500",
    blue: "bg-blue-500 text-white border-blue-500",
    green: "bg-green-500 text-white border-green-500",
    purple: "bg-purple-500 text-white border-purple-500",
    orange: "bg-orange-500 text-white border-orange-500",
    pink: "bg-pink-500 text-white border-pink-500",
    indigo: "bg-indigo-500 text-white border-indigo-500",
    yellow: "bg-yellow-500 text-white border-yellow-500",
    gray: "bg-gray-500 text-white border-gray-500",
    teal: "bg-teal-500 text-white border-teal-500",
  };
  return colorMap[color] || colorMap.gray;
};

const UnifiedCard: React.FC<UnifiedCardProps> = ({
  data,
  type,
  onEdit,
  onDelete,
  onClick,
  showActions = true,
}) => {
  const colorClasses = getColorClasses(data.color, type);
  const isClickable = !!onClick;

  const renderContent = () => {
    switch (type) {
      case "category":
      case "subcategory":
        return (
          <div
            className={`relative p-3 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-all duration-200 hover:scale-105 ${isClickable ? "cursor-pointer group" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-lg truncate">
                {data.name}
              </h3>
              {showActions && (
                <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="p-1 rounded-full transition-colors duration-200 cursor-pointer hover:text-gray-200"
                    title="Edit"
                  >
                    <EditIcon className="size-5" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white opacity-90">
                {data.itemCount} {type === "category" ? "Subcategories" : "Products"}
              </span>
              <span className="text-xs px-2 py-1 rounded-full border border-gray-300">
                {type === "category" ? "Category" : "Subcategory"}
              </span>
            </div>
          </div>
        );

      case "product":
        return (
          <div
            className={`relative p-3 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow duration-200 group`}
          >
            <div className="flex items-center justify-between mb-0">
              <h3 className="font-semibold text-white text-lg truncate">
                {data.name}
              </h3>
              {showActions && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="p-1 rounded-full transition-colors duration-200 cursor-pointer hover:text-gray-200"
                    title="Edit product"
                  >
                    <EditIcon className="size-5" />
                  </button>

                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="p-1 rounded-full transition-colors duration-200 cursor-pointer hover:text-red-200"
                      title="Delete product"
                    >
                      <DeleteIcon className="size-5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-white opacity-90 mb-2 line-clamp-2">
              {data.description}
            </p>

            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-white">
                ${data.price?.toFixed(2)}
              </span>
              <div className="flex items-center gap-2 justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    data.isAvailable
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {data.isAvailable ? "Available" : "Unavailable"}
                </span>
                <span className="text-xs px-2 py-1 rounded-full border border-gray-300">
                  Product
                </span>
              </div>
            </div>
          </div>
        );

      case "group":
        return (
          <div
            className={`relative p-3 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow duration-200 group`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-lg truncate">
                {data.name}
              </h3>
              {showActions && (
                <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="p-1 rounded-full transition-colors duration-200 cursor-pointer hover:text-gray-200"
                    title="Edit group"
                  >
                    <EditIcon className="size-5" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white opacity-90">
                {data.itemCount} items
              </span>
              <span className="text-xs px-2 py-1 rounded-full border border-gray-300">
                Group
              </span>
            </div>
          </div>
        );

      case "variant":
        return (
          <div
            className={`relative p-3 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow duration-200 cursor-pointer group`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-lg truncate">
                {data.name}
              </h3>
              {showActions && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="p-1 rounded-full transition-colors duration-200 cursor-pointer hover:text-gray-200"
                    title="Edit variant"
                  >
                    <EditIcon className="size-5" />
                  </button>

                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="p-1 rounded-full transition-colors duration-200 cursor-pointer hover:text-red-200"
                      title="Delete variant"
                    >
                      <DeleteIcon className="size-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {data.groupName && (
              <p className="text-xs opacity-75 mb-2 truncate">
                Group: {data.groupName}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white opacity-90">
                {data.variantCount} variants
              </span>
              <span className="text-xs px-2 py-1 rounded-full border border-gray-300">
                Variant
              </span>
            </div>
          </div>
        );

      case "menuPage":
        return (
          <div
            className={`relative p-2 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow duration-200 group`}
          >
            <div className="flex items-center justify-between mb-0">
              <h3 className="font-semibold text-white text-lg truncate">
                {data.name}
              </h3>
              {showActions && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="p-1 rounded-full transition-colors duration-200 cursor-pointer hover:text-gray-200"
                    title="Edit menu page"
                  >
                    <EditIcon className="size-4" />
                  </button>
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="p-1 rounded-full transition-colors duration-200 cursor-pointer hover:text-red-200"
                      title="Delete menu page"
                    >
                      <DeleteIcon className="size-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-white opacity-90 mb-0 line-clamp-2">
              {data.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white opacity-90">
                {data.itemCount} products
              </span>
              <span className="text-xs px-2 py-1 rounded-full border border-gray-300">
                Menu Page
              </span>
            </div>
          </div>
        );

      case "menu":
        return (
          <div
            className={`relative p-2 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow duration-200 group`}
          >
            <div className="flex items-center justify-between mb-0">
              <h3 className="font-semibold text-white text-lg truncate">
                {data.name}
              </h3>
              {showActions && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="p-1 rounded-full transition-colors duration-200 cursor-pointer hover:text-gray-200"
                    title="Edit menu"
                  >
                    <EditIcon className="size-4" />
                  </button>
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="p-1 rounded-full transition-colors duration-200 cursor-pointer hover:text-red-200"
                      title="Delete menu"
                    >
                      <DeleteIcon className="size-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-white opacity-90 mb-0 line-clamp-2">
              {data.description}
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-white">
                €{Number(data.price || 0).toFixed(2)}
              </span>
              <div className="flex items-center gap-2 justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    data.isAvailable
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {data.isAvailable ? "Available" : "Unavailable"}
                </span>
                <span className="text-xs px-2 py-1 rounded-full border border-gray-300">
                  Menu
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div onClick={onClick}>{renderContent()}</div>;
};

export { UnifiedCard };
