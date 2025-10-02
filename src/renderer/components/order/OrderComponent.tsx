import React, { useState } from "react";
import OrderCart from "./OrderCart";
import OrderProcessingModal from "./OrderProcessingModal";
import { useOrder } from "../../contexts/OrderContext";
import { toast } from "react-toastify";

interface OrderComponentProps {
  token: string | null;
}

const OrderComponent = ({ token }: OrderComponentProps) => {
  const { orderItems, removeFromOrder, updateQuantity, clearOrder } =
    useOrder();
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);

  const handleProcessOrder = () => {
    if (orderItems.length === 0) {
      alert("No items in order");
      return;
    }
    setIsProcessingModalOpen(true);
  };

  const handleProcessOrderSubmit = async (orderData: any) => {
    const result = await (window as any).electronAPI.saveOrder(token, orderData);
    if(!result.status) {
      toast.error("Unable to save order");
      return;
    }
    toast.success("Order saved successfully");
    clearOrder();
  };

  return (
    <>
      <OrderCart
        orderItems={orderItems}
        onRemoveItem={removeFromOrder}
        onUpdateQuantity={updateQuantity}
        onClearOrder={clearOrder}
        onProcessOrder={handleProcessOrder}
      />
      <OrderProcessingModal
        isOpen={isProcessingModalOpen}
        onClose={() => setIsProcessingModalOpen(false)}
        orderItems={orderItems}
        onProcessOrder={handleProcessOrderSubmit}
        token={token}
      />
    </>
  );
};

export default OrderComponent;
