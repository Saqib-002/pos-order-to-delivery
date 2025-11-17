import { CircleCheckIcon, DeleteIcon, EditIcon, GrabberIcon, NoMenuIcon, UnAvailableIcon } from "@/renderer/public/Svg";
import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";

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
  layout?: "row";
}

interface Config {
  padding: string;
  iconSize: string;
  actionsLayout: "row" | "col";
  headerMb: string;
  footerMb: string;
  hasDelete: boolean;
  getBody: (data: BaseCardData, t: any) => React.ReactNode;
  getLeft: (data: BaseCardData, t: any) => { text: ReactNode; className: string };
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
    getLeft: (data,t) => ({
      text: `${data.itemCount || 0} ${t('unifiedCard.catCountText')}`,
      className: "text-xs text-white opacity-90",
    }),
  },
  subcategory: {
    padding: "p-3",
    iconSize: "size-5",
    actionsLayout: "row",
    headerMb: "mb-2",
    footerMb: "",
    hasDelete: true,
    getBody: () => null,
    getLeft: (data,t) => ({
      text: (
        <>
          <span className="truncate">{`${data.itemCount || 0} ${t('unifiedCard.prodCountText')}`}</span>
          <span className="truncate">{`${data.menuCount || 0} ${t('unifiedCard.menuCountText')}`}</span>
        </>
      ),
      className: "text-sm text-white opacity-90 flex flex-col gap-0.5",
    }),
  },
  product: {
    padding: "p-2",
    iconSize: "size-5",
    actionsLayout: "row",
    headerMb: "mb-0",
    footerMb: "mb-2",
    hasDelete: true,
    getBody: (data,t) => (
      <p className="text-xs text-white opacity-90 mb-2 line-clamp-2">
        {data.description?.length ? data.description : t('unifiedCard.noDescription')}
      </p>
    ),
    getLeft: (data,t) => ({
      text: `€${Number(data.price || 0).toFixed(2)}`,
      className: "text-lg font-semibold text-white",
    }),
  },
  group: {
    padding: "p-3",
    iconSize: "size-5",
    actionsLayout: "col",
    headerMb: "mb-2",
    footerMb: "",
    hasDelete: false,
    getBody: () => null,
    getLeft: (data,t) => ({
      text: `${data.itemCount || 0} ${t('unifiedCard.groupCountText')}`,
      className: "text-sm text-white opacity-90",
    }),
  },
  variant: {
    padding: "p-3",
    iconSize: "size-5",
    actionsLayout: "row",
    headerMb: "mb-2",
    footerMb: "",
    hasDelete: true,
    getBody: (data,t) =>
      data.groupName ? (
        <p className="text-xs opacity-75 mb-2 truncate">
          Group: {data.groupName}
        </p>
      ) : null,
    getLeft: (data,t) => ({
      text: `${data.variantCount || 0} ${t('unifiedCard.variantCountText')}`,
      className: "text-sm text-white opacity-90",
    }),
  },
  menuPage: {
    padding: "p-2",
    iconSize: "size-4",
    actionsLayout: "row",
    headerMb: "mb-0",
    footerMb: "",
    hasDelete: true,
    getBody: (data,t) => (
      <p className="text-xs text-white opacity-90 mb-0 line-clamp-2">
        {data.description?.length ? data.description : t('unifiedCard.noDescription')}
      </p>
    ),
    getLeft: (data,t) => ({
      text: `${data.itemCount || 0} ${t('unifiedCard.prodCountText')}`,
      className: "text-sm text-white opacity-90",
    }),
  },
  menu: {
    padding: "p-2",
    iconSize: "size-4",
    actionsLayout: "row",
    headerMb: "mb-0",
    footerMb: "mb-2",
    hasDelete: true,
    getBody: (data,t) => (
      <p className="text-xs text-white opacity-90 mb-0 line-clamp-2">
        {data.description?.length ? data.description : t('unifiedCard.noDescription')}
      </p>
    ),
    getLeft: (data,t) => ({
      text: `€${Number(data.price || 0).toFixed(2)}`,
      className: "text-lg font-semibold text-white",
    }),
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
  layout,
}, ref) => {
  const { t } = useTranslation();
  const colorClasses = getColorClasses(data.color, type);
  const isClickable = !!onClick;
  const config = configs[type];
  if (!config) return null;

  const { padding, iconSize, actionsLayout, headerMb, footerMb, hasDelete } = config;
  const bodyContent = config.getBody(data,t);
  const left = config.getLeft(data,t);

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
      onClick={onClick}
      className={`relative ${padding} rounded-lg border-2 ${colorClasses} hover:shadow-md transition-all duration-200 group ${isClickable ? "cursor-pointer" : ""
        } ${["product", "menu"].includes(type) ? "cursor-grab active:cursor-grabbing" : ""} ${layout === "row" ? "flex flex-row items-center gap-2 !p-2 w-full min-w-0" : ""}`}
    >
      {['product', 'menu', 'category', 'subcategory'].includes(type) &&
        <img
          crossOrigin="anonymous"
          src={data.imgUrl || 'pizza.jpg'}
          alt={`${data.name || 'Product'} image`}
          className={`rounded-md object-cover ${layout === "row" ? "w-16 h-16" : "w-full h-34"}`}
          onDragStart={(e) => e.preventDefault()}
        />
      }
      <div className={`${layout === "row" ? "flex flex-col flex-1 min-w-0" : ""}`}>
        <div className={`flex items-center justify-between ${headerMb} ${layout === "row" ? "!m-0" : "mt-1 w-full"}`}>
          <h3 className={`font-semibold text-white flex-shrink-0 flex-1 max-w-full line-clamp-2 leading-tight pr-2 ${layout === "row" ? "text-base" : "text-lg"}`}>{data.name}</h3>
          {renderActions()}
        </div>
        {bodyContent && (
          <div className={`mt-1 text-xs text-white opacity-90 line-clamp-2 ${layout === "row" ? "max-w-full" : ""}`}>
            {bodyContent}
          </div>
        )}
        <div className={`flex items-center justify-between ${footerMb} w-full`}>
          <div className={`${left.className} truncate ${layout === "row" ? "!gap-0 text-xs" : ""}`}>{left.text}</div>
          {(type === "product" || type === "menu") && (
            <>
              {
                data.isAvailable ? (
                  <CircleCheckIcon className="size-5 text-green-400" />
                ) : (
                  <UnAvailableIcon className="size-5 text-red-600" />
                )
              }
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export { UnifiedCard };
