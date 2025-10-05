import { OrderItem } from "@/types/order";

export const calculateOrderTotal = (items: OrderItem[]): number => {
  const nonMenuItems = items.filter((item) => !item.menuId);
  const menuItems = items.filter((item) => item.menuId);

  const nonMenuTotal = nonMenuItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  const menuGroups = menuItems.reduce(
    (
      acc: Record<
        string,
        {
          key: string;
          menuId: string;
          menuName: string;
          secondaryId: number;
          basePrice: number;
          taxPerUnit: number;
          supplementTotal: number;
          items: OrderItem[];
        }
      >,
      item
    ) => {
      const key = `${item.menuId}-${item.menuSecondaryId}`;
      const menuPrice = item.menuPrice ?? 0;
      const menuTax = item.menuTax ?? 0;
      const supplement = item.supplement ?? 0;

      if (!acc[key]) {
        acc[key] = {
          key,
          menuId: item.menuId!,
          menuName: item.menuName!,
          secondaryId: item.menuSecondaryId! as number,
          basePrice: menuPrice,
          taxPerUnit: menuTax,
          supplementTotal: supplement,
          items: [],
        };
      } else {
        acc[key].supplementTotal += supplement;
      }
      acc[key].items.push(item);
      return acc;
    },
    {}
  );

  const menuTotal = Object.values(menuGroups).reduce((total, group) => {
    const qty = group.items[0]?.quantity || 1;
    const menuGroupTotal =
      (group.basePrice + group.taxPerUnit + group.supplementTotal) * qty;
    return total + menuGroupTotal;
  }, 0);

  return nonMenuTotal + menuTotal;
};

export const calculateItemTotal = (item: OrderItem): number => {
  if (item.menuId) {
    const menuPrice = item.menuPrice ?? 0;
    const menuTax = item.menuTax ?? 0;
    const supplement = item.supplement ?? 0;
    return (menuPrice + menuTax + supplement) * item.quantity;
  } else {
    return item.totalPrice;
  }
};

export const calculateTaxPercentage = (
  basePrice: number,
  taxAmount: number
): number => {
  if (basePrice <= 0) return 0;
  return Math.round((taxAmount / basePrice) * 100);
};
