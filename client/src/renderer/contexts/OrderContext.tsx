import { Product } from "@/types/Menu";
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
  removeMenuItemFromOrder: (
    menuId: string,
    menuSecondaryId: number,
    productId: string,
    menuPageId: string
  ) => void;
  processedMenuOrderItems: OrderItem[];
  addToProcessedMenuOrderItems: (item: OrderItem) => void;
  clearProcessedMenuOrderItems: () => void;
  getMaxSecondaryId: (menuId: string) => number;
  editOrderItem: (itemId: string, item: Partial<OrderItem>) => void;
  selectedProduct: Product | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  selectedMenu: any;
  setSelectedMenu: React.Dispatch<React.SetStateAction<any>>;
  mode: "menu" | "product";
  setMode: React.Dispatch<React.SetStateAction<"menu" | "product">>;
  editingGroup: any;
  setEditingGroup: React.Dispatch<React.SetStateAction<any>>;
  editingProduct: any;
  setEditingProduct: React.Dispatch<React.SetStateAction<any>>;
}

export const OrderContext = createContext<OrderContextType | undefined>(
  undefined
);

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [mode, setMode] = useState<"menu" | "product">("menu");

  const addToOrder = async (newItem: OrderItem) => {
    setOrderItems((prev) => [...prev, newItem]);
    if (mode === "menu") {
      const newItems = [...orderItems, newItem];
      const { groups } = calculateOrderTotal(newItems);
      const group = groups.find(
        (g) => g.key === `${newItem.menuId}-${newItem.menuSecondaryId}`
      );
      if (group) {
        setEditingGroup(group);
      }
    }
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
              isKitchenPrinted: false
            }
          : item
      )
    );
  };

  const clearOrder = () => {
    setOrderItems([]);
  };

  const findExactProductMatch = (
    productId: string,
    variantId: string | undefined,
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
        if (variantId && (item.variantId !== variantId)) return false;

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
  const removeMenuItemFromOrder = async (
    menuId: string,
    menuSecondaryId: number,
    productId: string,
    menuPageId: string
  ) => {
    const newOrderItems = orderItems.filter(
      (item) =>
        !item.menuId ||
        !(
          item.menuId === menuId &&
          item.menuSecondaryId === menuSecondaryId &&
          item.menuPageId === menuPageId &&
          item.productId === productId
        )
    );
    setOrderItems(newOrderItems);
    const newProcessedItems = processedMenuOrderItems.filter(
      (item) =>
        !item.menuId ||
        !(
          item.menuId === menuId &&
          item.menuSecondaryId === menuSecondaryId &&
          item.menuPageId === menuPageId &&
          item.productId === productId
        )
    );
    setProcessedMenuOrderItems(newProcessedItems);
    const editingGroupItems = editingGroup.items.filter(
      (item: any) =>
        !item.menuId ||
        !(
          item.menuId === menuId &&
          item.menuSecondaryId === menuSecondaryId &&
          item.menuPageId === menuPageId &&
          item.productId === productId
        )
    );
    setEditingGroup({ ...editingGroup, items: editingGroupItems });
  };
  const editOrderItem = (itemId: string, item: Partial<OrderItem>) => {
    const existingOrderItem = orderItems.find(
      (orderItem) => orderItem.id === itemId
    );
    if (existingOrderItem) {
      const updatedOrderItems = orderItems.map((orderItem) => {
        if (orderItem.id === itemId) {
          return {
            ...orderItem,
            ...item,
            id: itemId,
          };
        }
        return orderItem;
      });
      setOrderItems(updatedOrderItems);
      if (mode === "menu") {
        const { groups } = calculateOrderTotal(updatedOrderItems);
        const group = groups.find(
          (g) => g.key === `${item.menuId}-${item.menuSecondaryId}`
        );
        if (group) {
          setEditingGroup(group);
        }
      }
    }
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
    findExactProductMatch,
    removeMenuFromOrder,
    removeMenuItemFromOrder,
    clearOrder,
    processedMenuOrderItems,
    addToProcessedMenuOrderItems,
    clearProcessedMenuOrderItems,
    getMaxSecondaryId,
    editOrderItem,
    selectedProduct,
    setSelectedProduct,
    selectedMenu,
    setSelectedMenu,
    mode,
    setMode,
    editingGroup,
    setEditingGroup,
    editingProduct,
    setEditingProduct,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};
