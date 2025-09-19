import React from "react";

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
  type: "category" | "subcategory" | "product" | "group" | "variant";
  onEdit: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  showActions?: boolean;
}

const getColorClasses = (color: string|undefined, type: string) => {
  if (!color){
    return 'bg-gray-500 text-white border-gray-500';
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
            className={`relative p-4 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow duration-200 ${isClickable ? "cursor-pointer group" : ""}`}
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
                    className="p-1 rounded-full transition-colors duration-200"
                    title="Edit"
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
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white opacity-90">
                {data.itemCount} items
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
            className={`relative p-4 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow duration-200 group`}
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
                    className="p-1 rounded-full transition-colors duration-200"
                    title="Edit product"
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

                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="p-1 rounded-full transition-colors duration-200"
                      title="Delete product"
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
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  data.isAvailable
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {data.isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 rounded-full border border-gray-300">
                Product
              </span>
            </div>
          </div>
        );

      case "group":
        return (
          <div
            className={`relative p-4 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow duration-200 group`}
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
                    className="p-1 rounded-full transition-colors duration-200"
                    title="Edit group"
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
            className={`relative p-2 rounded-lg border-2 ${colorClasses} hover:shadow-md transition-shadow duration-200 cursor-pointer group`}
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
                    className="p-1 rounded-full transition-colors duration-200"
                    title="Edit variant"
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

                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="p-1 rounded-full transition-colors duration-200"
                      title="Delete variant"
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

      default:
        return null;
    }
  };

  return <div onClick={onClick}>{renderContent()}</div>;
};

export { UnifiedCard };
