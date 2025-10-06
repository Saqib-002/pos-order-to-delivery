import { Order, OrderItem } from "@/types/order";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { calculateOrderTotal } from "../utils/orderCalculations";

interface OrderContextType {
  orderItems: OrderItem[];
  order: Order | null;
  setOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  addToOrder: (item: OrderItem) => void;
  removeFromOrder: (itemId: string | undefined) => void;
  updateQuantity: (itemId: string | undefined, quantity: number) => void;
  clearOrder: () => void;
  isProductExists: (productId: string) => boolean;
  findExactProductMatch: (
    productId: string,
    variantId: string,
    complements: Array<{
      groupId: string;
      groupName: string;
      itemId: string;
      itemName: string;
      price: number;
      priority: number;
    }>
  ) => OrderItem | null;
  removeMenuFromOrder: (menuId: string, menuSecondaryId: number) => void;
  getOrderTotal: () => number;
  processedMenuOrderItems: OrderItem[];
  addToProcessedMenuOrderItems: (item: OrderItem) => void;
  clearProcessedMenuOrderItems: () => void;
  getMaxSecondaryId: (menuId: string) => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [processedMenuOrderItems, setProcessedMenuOrderItems] = useState<
    OrderItem[]
  >([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);

  const addToOrder = async (newItem: OrderItem) => {
    setOrderItems((prev) => [...prev, newItem]);
  };

  const removeFromOrder = (itemId: string | undefined) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string | undefined, quantity: number) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              totalPrice:
                Math.round(
                  (item.productPrice +
                    item.productTax +
                    item.variantPrice +
                    item.complements.reduce(
                      (sum, comp) => sum + comp.price,
                      0
                    )) *
                    quantity *
                    100
                ) / 100,
            }
          : item
      )
    );
  };

  const clearOrder = () => {
    setOrderItems([]);
  };

  const getOrderTotal = () => {
    return calculateOrderTotal(orderItems);
  };
  const isProductExists = (productId: string): boolean => {
    return !!orderItems.find(
      (item) => !item.menuId && item.productId === productId
    );
  };

  const findExactProductMatch = (
    productId: string,
    variantId: string,
    complements: Array<{
      groupId: string;
      groupName: string;
      itemId: string;
      itemName: string;
      price: number;
      priority: number;
    }>
  ): OrderItem | null => {
    return (
      orderItems.find((item) => {
        if (item.menuId || item.productId !== productId) return false;

        if (item.variantId !== variantId) return false;

        if (item.complements.length !== complements.length) return false;
        const itemComplements = item.complements.sort(
          (a, b) =>
            a.groupId.localeCompare(b.groupId) ||
            a.itemId.localeCompare(b.itemId)
        );

        const newComplements = complements.sort(
          (a, b) =>
            a.groupId.localeCompare(b.groupId) ||
            a.itemId.localeCompare(b.itemId)
        );

        return itemComplements.every((itemComp, index) => {
          const newComp = newComplements[index];
          return (
            itemComp.groupId === newComp.groupId &&
            itemComp.itemId === newComp.itemId
          );
        });
      }) || null
    );
  };
  const removeMenuFromOrder = async (
    menuId: string,
    menuSecondaryId: number
  ) => {
    const newOrderItems = orderItems.filter(
      (item) =>
        !item.menuId ||
        !(item.menuId === menuId && item.menuSecondaryId === menuSecondaryId)
    );
    setOrderItems(newOrderItems);
  };
  const addToProcessedMenuOrderItems = (newItem: OrderItem) => {
    setProcessedMenuOrderItems((prev) => [...prev, newItem]);
  };
  const clearProcessedMenuOrderItems = () => {
    setProcessedMenuOrderItems([]);
  };
  const getMaxSecondaryId = (menuId: string) => {
    const menuItems = orderItems.filter(
      (item) =>
        item.menuId &&
        item.menuId === menuId &&
        item.menuSecondaryId !== undefined
    );
    if (menuItems.length === 0) {
      return 0;
    }
    return Math.max(...menuItems.map((item) => item.menuSecondaryId!));
  };
  const value: OrderContextType = {
    orderItems,
    order,
    setOrder,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    isProductExists,
    findExactProductMatch,
    removeMenuFromOrder,
    clearOrder,
    getOrderTotal,
    processedMenuOrderItems,
    addToProcessedMenuOrderItems,
    clearProcessedMenuOrderItems,
    getMaxSecondaryId,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};
