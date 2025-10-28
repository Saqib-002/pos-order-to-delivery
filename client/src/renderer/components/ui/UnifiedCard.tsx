import { DeleteIcon, EditIcon, GrabberIcon } from "@/renderer/public/Svg";
import React, { ReactNode } from "react";

interface BaseCardData {
  id: string;
  name?: string;
  itemCount?: number;
  menuCount?: number;
  color?: string;
  description?: string;
  imgUrl?: string;
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
  style?: React.CSSProperties;
  dragAttributes?: any;
  dragListeners?: any;
}

interface Config {
  padding: string;
  iconSize: string;
  actionsLayout: "row" | "col";
  headerMb: string;
  footerMb: string;
  hasDelete: boolean;
  getBody: (data: BaseCardData) => React.ReactNode;
  getLeft: (data: BaseCardData) => { text: ReactNode; className: string };
  getRight: (data: BaseCardData) => React.ReactNode[];
}

const configs: Record<UnifiedCardProps["type"], Config> = {
  category: {
    padding: "p-3",
    iconSize: "size-5",
    actionsLayout: "row",
    headerMb: "mb-2",
    footerMb: "gap-2",
    hasDelete: true,
    getBody: () => null,
    getLeft: (data) => ({
      text: `${data.itemCount || 0} Subcategories`,
      className: "text-xs text-white opacity-90",
    }),
    getRight: () => [
      <span
        key="label"
        className="text-xs px-2 py-1 rounded-full border border-gray-300"
      >
        Category
      </span>,
    ],
  },
  subcategory: {
    padding: "p-3",
    iconSize: "size-5",
    actionsLayout: "row",
    headerMb: "mb-2",
    footerMb: "",
    hasDelete: true,
    getBody: () => null,
    getLeft: (data) => ({
      text: (
        <>
          <span>{`${data.itemCount || 0} Products`}</span>
          <span>{`${data.menuCount || 0} Menus`}</span>
        </>
      ),
      className: "text-sm text-white opacity-90 flex flex-col gap-0.5",
    }),
    getRight: () => [
      <span
        key="label"
        className="text-xs px-2 py-1 rounded-full border border-gray-300"
      >
        Subcategory
      </span>,
    ],
  },
  product: {
    padding: "p-2",
    iconSize: "size-5",
    actionsLayout: "row",
    headerMb: "mb-0",
    footerMb: "mb-2",
    hasDelete: true,
    getBody: (data) => (
      <p className="text-xs text-white opacity-90 mb-2 line-clamp-2">
        {data.description}
      </p>
    ),
    getLeft: (data) => ({
      text: `€${Number(data.price || 0).toFixed(2)}`,
      className: "text-lg font-semibold text-white",
    }),
    getRight: (data) => [
      <span
        key="avail"
        className={`text-xs px-2 py-1 rounded-full ${data.isAvailable ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
      >
        {data.isAvailable ? "Available" : "Unavailable"}
      </span>,
      <span
        key="label"
        className="text-xs px-2 py-1 rounded-full border border-gray-300"
      >
        Product
      </span>,
    ],
  },
  group: {
    padding: "p-3",
    iconSize: "size-5",
    actionsLayout: "col",
    headerMb: "mb-2",
    footerMb: "",
    hasDelete: false,
    getBody: () => null,
    getLeft: (data) => ({
      text: `${data.itemCount || 0} items`,
      className: "text-sm text-white opacity-90",
    }),
    getRight: () => [
      <span
        key="label"
        className="text-xs px-2 py-1 rounded-full border border-gray-300"
      >
        Group
      </span>,
    ],
  },
  variant: {
    padding: "p-3",
    iconSize: "size-5",
    actionsLayout: "row",
    headerMb: "mb-2",
    footerMb: "",
    hasDelete: true,
    getBody: (data) =>
      data.groupName ? (
        <p className="text-xs opacity-75 mb-2 truncate">
          Group: {data.groupName}
        </p>
      ) : null,
    getLeft: (data) => ({
      text: `${data.variantCount || 0} variants`,
      className: "text-sm text-white opacity-90",
    }),
    getRight: () => [
      <span
        key="label"
        className="text-xs px-2 py-1 rounded-full border border-gray-300"
      >
        Variant
      </span>,
    ],
  },
  menuPage: {
    padding: "p-2",
    iconSize: "size-4",
    actionsLayout: "row",
    headerMb: "mb-0",
    footerMb: "",
    hasDelete: true,
    getBody: (data) => (
      <p className="text-xs text-white opacity-90 mb-0 line-clamp-2">
        {data.description?.length ? data.description : "No description"}
      </p>
    ),
    getLeft: (data) => ({
      text: `${data.itemCount || 0} products`,
      className: "text-sm text-white opacity-90",
    }),
    getRight: () => [
      <span
        key="label"
        className="text-xs px-2 py-1 rounded-full border border-gray-300"
      >
        Menu Page
      </span>,
    ],
  },
  menu: {
    padding: "p-2",
    iconSize: "size-4",
    actionsLayout: "row",
    headerMb: "mb-0",
    footerMb: "mb-2",
    hasDelete: true,
    getBody: (data) => (
      <p className="text-xs text-white opacity-90 mb-0 line-clamp-2">
        {data.description}
      </p>
    ),
    getLeft: (data) => ({
      text: `€${Number(data.price || 0).toFixed(2)}`,
      className: "text-lg font-semibold text-white",
    }),
    getRight: (data) => [
      <span
        key="avail"
        className={`text-xs px-2 py-1 rounded-full ${data.isAvailable ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
      >
        {data.isAvailable ? "Available" : "Unavailable"}
      </span>,
      <span
        key="label"
        className="text-xs px-2 py-1 rounded-full border border-gray-300"
      >
        Menu
      </span>,
    ],
  },
};

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

const UnifiedCard = React.forwardRef<HTMLDivElement, UnifiedCardProps>(({
  data,
  type,
  onEdit,
  onDelete,
  onClick,
  showActions = true,
  style,
  dragAttributes,
  dragListeners,
}, ref) => {
  const colorClasses = getColorClasses(data.color, type);
  const isClickable = !!onClick;
  const config = configs[type];
  if (!config) return null;

  const { padding, iconSize, actionsLayout, headerMb, footerMb, hasDelete } = config;
  const bodyContent = config.getBody(data);
  const left = config.getLeft(data);
  const rightContent = config.getRight(data);

  const renderActions = () => {
    if (!showActions) return null;
    const createButton = (
      onClick: () => void,
      hoverClass: string,
      title: string,
      Icon: React.ComponentType<{ className: string }>
    ) => (
      <button
        key={title}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`p-1 rounded-full transition-colors duration-200 cursor-pointer ${hoverClass}`}
        onPointerDown={(e) => {
            e.stopPropagation();
          }}
        title={title}
      >
        <Icon className={iconSize} />
      </button>
    );
    const actionClass = `flex ${actionsLayout === "col" ? "flex-col items-center gap-1" : "items-center gap-1"
      }`;
    const shouldShowDelete = hasDelete && onDelete && (type === "category" ? Number(data.itemCount) === 0 : (type === "subcategory" ? (Number(data.itemCount) === 0 && Number(data.menuCount) === 0) : true));
    return (
      <div className={actionClass}>
        {createButton(onEdit, "hover:text-gray-200", "Edit", EditIcon)}
        {shouldShowDelete && createButton(onDelete, "hover:text-red-200", "Delete", DeleteIcon)}
      </div>
    );
  };
  return (
    <div
      ref={ref}
      style={style}
      {...(type === "product" ? dragAttributes : {})}
      {...(type === "product" ? dragListeners : {})}
      onClick={type !== "product" ? onClick : undefined}
      className={`relative ${padding} rounded-lg border-2 ${colorClasses} hover:shadow-md transition-all duration-200 group ${isClickable ? "cursor-pointer" : ""
        } ${ ["product", "menu"].includes(type) ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {['product', 'menu', 'category', 'subcategory'].includes(type) &&
        <img
          crossOrigin="anonymous"
          src={data.imgUrl || 'pizza.jpg'}
          alt={`${data.name || 'Product'} image`}
          className="w-full h-34 object-cover rounded-md"
          onDragStart={(e) => e.preventDefault()}
        />
      }
      <div className={`flex items-center justify-between mt-1 ${headerMb}`}>
        <h3 className="font-semibold text-white text-lg truncate">{data.name}</h3>
          {renderActions()}
      </div>
      {bodyContent}
      <div className={`flex items-center justify-between ${footerMb}`}>
        <div className={left.className}>{left.text}</div>
        <div className="flex items-center gap-2">{rightContent}</div>
      </div>
    </div>
  );
});

export { UnifiedCard };