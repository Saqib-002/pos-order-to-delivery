import { TOAST_DEBOUNCE_MS } from "@/constants";
import { debounce } from "lodash";
import { toast } from "react-toastify";

export const showToast = {
  success: debounce((message: string) => toast.success(message), TOAST_DEBOUNCE_MS),
  error: debounce((message: string) => toast.error(message), TOAST_DEBOUNCE_MS),
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