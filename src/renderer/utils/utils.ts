import { TOAST_DEBOUNCE_MS } from "@/constants";
import { debounce } from "lodash";
import { toast } from "react-toastify";

export const showToast = {
    success: debounce(
        (message: string) => toast.success(message),
        TOAST_DEBOUNCE_MS
    ),
    error: debounce(
        (message: string) => toast.error(message),
        TOAST_DEBOUNCE_MS
    ),
};
export const formatAddress = (address: string) => {
    if (!address) return "";
    const parts = address.split("|");
    return (
      parts
        .map((item, index) => {
          if (index === 1) return null;
          const value = item.split("=")[1];
          return value || "";
        })
        .filter(Boolean)
        .join(", ") +
      ", " +
      (parts[1]?.split("=")[1] || "")
    );
  };

export const colorOptions = [
    { value: "red", label: "Red", color: "bg-red-500" },
    { value: "blue", label: "Blue", color: "bg-blue-500" },
    { value: "green", label: "Green", color: "bg-green-500" },
    { value: "purple", label: "Purple", color: "bg-purple-500" },
    { value: "orange", label: "Orange", color: "bg-orange-500" },
    { value: "pink", label: "Pink", color: "bg-pink-500" },
    { value: "indigo", label: "Indigo", color: "bg-indigo-500" },
    { value: "yellow", label: "Yellow", color: "bg-yellow-500" },
    { value: "gray", label: "Gray", color: "bg-gray-500" },
];
export const calculateBaseProductPrice = (product: any) => {
    const productTaxRate = (product.tax || 0) / 100;
    return Math.round((product.price / (1 + productTaxRate)) * 100) / 100;
};

export const calculateProductTaxAmount = (product: any) => {
    const productTaxRate = (product.tax || 0) / 100;
    return (
        Math.round(
            (product.price - product.price / (1 + productTaxRate)) * 100
        ) / 100
    );
};