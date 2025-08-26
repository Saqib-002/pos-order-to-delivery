import { TOAST_DEBOUNCE_MS } from "@/constants";
import { debounce } from "lodash";
import { toast } from "react-toastify";

export const showToast = {
  success: debounce((message: string) => toast.success(message), TOAST_DEBOUNCE_MS),
  error: debounce((message: string) => toast.error(message), TOAST_DEBOUNCE_MS),
};