import { MenuItem } from "@/types/menu";

export interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  categories: string[];
  onSuccess: () => void;
  editingItem?: MenuItem | null;
}

export interface CategoryInputProps {
  customCategory: string;
  onCustomCategoryChange: (value: string) => void;
  showCustomCategoryInput: boolean;
  onShowCustomCategoryInput: (show: boolean) => void;
  isDuplicateCategory: boolean;
  onDuplicateCategoryChange: (isDuplicate: boolean) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  getCategoryLabel: (category: string) => string;
}
