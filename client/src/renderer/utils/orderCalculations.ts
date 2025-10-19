import { OrderItem } from "@/types/order";

export const calculateOrderTotal = (
  items: OrderItem[]
): {
  orderTotal: number;
  nonMenuItems: OrderItem[];
  groups: Array<{
    key: string;
    menuId: string;
    menuName: string;
    secondaryId: number;
    basePrice: number;
    taxPerUnit: number;
    supplementTotal: number;
    items: OrderItem[];
  }>;
} => {
  const nonMenuItems = items.filter((item) => !item.menuId);
  const menuItems = items.filter((item) => item.menuId);

  const nonMenuTotal = nonMenuItems.reduce((sum, item) => {
    const complementsTotal = Array.isArray(item.complements)
      ? item.complements.reduce(
          (complementSum, complement) => complementSum + complement.price,
          0
        )
      : 0;
    const itemTotal =
      (item.productPrice +
        item.productTax -
        item.productDiscount +
        item.variantPrice +
        complementsTotal) *
      item.quantity;
    return sum + itemTotal;
  }, 0);

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
    const menuGroupPrice =
      (group.basePrice + group.taxPerUnit + group.supplementTotal) * qty;
    const variantsAndComplementsTotal = group.items.reduce(
      (itemTotal, item) => {
        const complementsTotal = Array.isArray(item.complements)
          ? item.complements.reduce(
              (sum, complement) => sum + complement.price,
              0
            )
          : 0;

        return (
          itemTotal +
          ((item.variantPrice || 0) + complementsTotal) * item.quantity
        );
      },
      0
    );

    return total + menuGroupPrice + variantsAndComplementsTotal;
  }, 0);

  return {
    orderTotal: nonMenuTotal + menuTotal,
    nonMenuItems,
    groups: Object.values(menuGroups),
  };
};

export const calculateItemTotal = (item: OrderItem): number => {
  if (item.menuId) {
    const menuPrice = item.menuPrice ?? 0;
    const menuTax = item.menuTax ?? 0;
    const supplement = item.supplement ?? 0;
    return (menuPrice + menuTax + supplement) * item.quantity;
  } else {
    const complementsTotal = Array.isArray(item.complements)
      ? item.complements.reduce((sum, complement) => sum + complement.price, 0)
      : 0;
    const itemTotal =
      (item.productPrice +
        item.productTax -
        item.productDiscount +
        item.variantPrice +
        complementsTotal) *
      item.quantity;
    return itemTotal;
  }
};

export const calculateTaxPercentage = (
  basePrice: number,
  taxAmount: number
): number => {
  if (basePrice <= 0) return 0;
  return Math.round((taxAmount / basePrice) * 100);
};
