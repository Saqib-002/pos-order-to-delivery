import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  ChefHat,
  Package,
  Bike,
  CheckCircle2,
  CheckCheck,
  XCircle,
  CreditCard,
  AlertCircle,
  Coins,
  ChevronDown,
  X,
  Filter,
  Check,
} from "lucide-react";

export interface StatusFilterOption {
  value: string;
  label: string;
  category: "all" | "status" | "payment";
  dotColor: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

interface OrderStatusFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const OrderStatusFilterDropdown: React.FC<OrderStatusFilterDropdownProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const options: StatusFilterOption[] = [
    {
      value: "all",
      label: t("orderManagement.filters.allOrders", "All Orders"),
      category: "all",
      dotColor: "bg-gray-400",
      bgLight: "bg-gray-100",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
      icon: <Filter className="size-3.5 text-gray-500" />,
    },
    // Order statuses
    {
      value: "status:pending",
      label: t("orderManagement.filters.pending", "Pending"),
      category: "status",
      dotColor: "bg-amber-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
      icon: <Clock className="size-3.5 text-amber-600" />,
    },
    {
      value: "status:sent to kitchen",
      label: t("orderManagement.filters.sentToKitchen", "In Kitchen"),
      category: "status",
      dotColor: "bg-indigo-500",
      bgLight: "bg-indigo-50",
      textColor: "text-indigo-700",
      borderColor: "border-indigo-200",
      icon: <ChefHat className="size-3.5 text-indigo-600" />,
    },
    {
      value: "status:ready for delivery",
      label: t("orderManagement.filters.readyForDelivery", "Ready for Delivery"),
      category: "status",
      dotColor: "bg-cyan-500",
      bgLight: "bg-cyan-50",
      textColor: "text-cyan-700",
      borderColor: "border-cyan-200",
      icon: <Package className="size-3.5 text-cyan-600" />,
    },
    {
      value: "status:out for delivery",
      label: t("orderManagement.filters.outForDelivery", "Out for Delivery"),
      category: "status",
      dotColor: "bg-blue-500",
      bgLight: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      icon: <Bike className="size-3.5 text-blue-600" />,
    },
    {
      value: "status:completed",
      label: t("orderManagement.filters.completed", "Completed"),
      category: "status",
      dotColor: "bg-emerald-500",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
      icon: <CheckCircle2 className="size-3.5 text-emerald-600" />,
    },
    {
      value: "status:delivered",
      label: t("orderManagement.filters.delivered", "Delivered"),
      category: "status",
      dotColor: "bg-teal-500",
      bgLight: "bg-teal-50",
      textColor: "text-teal-700",
      borderColor: "border-teal-200",
      icon: <CheckCheck className="size-3.5 text-teal-600" />,
    },
    {
      value: "status:cancelled",
      label: t("orderManagement.filters.cancelled", "Cancelled"),
      category: "status",
      dotColor: "bg-rose-500",
      bgLight: "bg-rose-50",
      textColor: "text-rose-700",
      borderColor: "border-rose-200",
      icon: <XCircle className="size-3.5 text-rose-600" />,
    },
    // Payment statuses
    {
      value: "payment:PAID",
      label: t("orderManagement.filters.paid", "Paid"),
      category: "payment",
      dotColor: "bg-emerald-500",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
      icon: <CreditCard className="size-3.5 text-emerald-600" />,
    },
    {
      value: "payment:UNPAID",
      label: t("orderManagement.filters.unpaid", "Unpaid"),
      category: "payment",
      dotColor: "bg-red-500",
      bgLight: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
      icon: <AlertCircle className="size-3.5 text-red-600" />,
    },
    {
      value: "payment:PARTIAL",
      label: t("orderManagement.filters.partialPayment", "Partial Payment"),
      category: "payment",
      dotColor: "bg-amber-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
      icon: <Coins className="size-3.5 text-amber-600" />,
    },
  ];

  const currentOption = options.find((opt) => opt.value === value) || options[0];
  const isFiltered = value && value !== "all";

  const orderStatusOptions = options.filter((o) => o.category === "status");
  const paymentStatusOptions = options.filter((o) => o.category === "payment");

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("all");
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3 py-3 rounded-lg border text-sm font-normal flex items-center justify-between gap-2 transition-colors duration-150 cursor-pointer ${
          isFiltered
            ? `${currentOption.bgLight} ${currentOption.borderColor} ${currentOption.textColor} font-medium`
            : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span
            className={`size-2 rounded-full shrink-0 ${currentOption.dotColor}`}
          />
          <span className="truncate">{currentOption.label}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {isFiltered && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-black/10 transition-colors text-gray-400 hover:text-gray-700"
              title="Clear filter"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown
            className={`size-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-gray-700" : ""
            }`}
          />
        </div>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-60 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1.5 animate-in fade-in-0 zoom-in-95 duration-100">
          {/* All Orders Option */}
          <div className="px-1.5 pb-1 mb-1 border-b border-gray-100">
            <button
              type="button"
              onClick={() => handleSelect("all")}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                value === "all"
                  ? "bg-zinc-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-gray-400" />
                <span>{t("orderManagement.filters.allOrders", "All Orders")}</span>
              </div>
              {value === "all" && <Check className="size-3.5 text-white" />}
            </button>
          </div>

          {/* Order Status Section */}
          <div className="px-2.5 pt-1 pb-1">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">
              {t("orderManagement.filters.orderStatus", "Order Status")}
            </div>
            <div className="space-y-0.5">
              {orderStatusOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? `${opt.bgLight} ${opt.textColor} font-semibold ring-1 ${opt.borderColor}`
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`size-2 rounded-full shrink-0 ${opt.dotColor}`} />
                      <span className="shrink-0">{opt.icon}</span>
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && (
                      <Check className={`size-3.5 shrink-0 ${opt.textColor}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Status Section */}
          <div className="px-2.5 pt-2 pb-1 border-t border-gray-100 mt-1">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">
              {t("orderManagement.filters.paymentStatus", "Payment Status")}
            </div>
            <div className="space-y-0.5">
              {paymentStatusOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? `${opt.bgLight} ${opt.textColor} font-semibold ring-1 ${opt.borderColor}`
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`size-2 rounded-full shrink-0 ${opt.dotColor}`} />
                      <span className="shrink-0">{opt.icon}</span>
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && (
                      <Check className={`size-3.5 shrink-0 ${opt.textColor}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
