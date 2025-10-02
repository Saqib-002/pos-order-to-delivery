import React, { useState } from "react";
import OrderCart from "./OrderCart";
import OrderProcessingModal from "./OrderProcessingModal";
import { useOrder } from "../../contexts/OrderContext";

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
    // TODO: Call the saveOrder API when ready
    const result = await (window as any).electronAPI.saveOrder(token, orderData);
    console.log("Order save result:", result);

    console.log("Processing order:", orderData);
    alert("Order logged to console (API call commented out)");
    clearOrder(); // Clear the cart after processing
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
