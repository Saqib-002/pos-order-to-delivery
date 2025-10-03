import React, { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "react-toastify";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productTax: number;
  variantId: string;
  variantName: string;
  variantPrice: number;
  complements: Array<{
    groupId: string;
    groupName: string;
    itemId: string;
    itemName: string;
    price: number;
  }>;
  quantity: number;
  totalPrice: number;
  menuContext?: {
    menuId: string;
    menuName: string;
    menuPageId: string;
    menuPageName: string;
    supplement: number;
  };
}
interface Order {
  id: string;
  orderId: string;
  status: string;
  updatedAt?: string;
  createdAt?: string;
}

interface OrderContextType {
  orderItems: OrderItem[];
  order: Order | null;
  setOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  addToOrder: ( item: OrderItem) => void;
  removeFromOrder: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearOrder: () => void;
  getOrderTotal: () => number;
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
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null)

  const addToOrder = async (newItem: OrderItem) => {
    setOrderItems((prev) => [...prev, newItem]);
  };

  const removeFromOrder = (itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
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
    return orderItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const value: OrderContextType = {
    orderItems,
    order,
    setOrder,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    clearOrder,
    getOrderTotal,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};
