import { useEffect, useState } from 'react';
import { Order } from '@/types/order';

export const KitchenView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const results = await (window as any).electronAPI.getOrders();
      setOrders(results);
    };
    fetchOrders();
  }, []);

  const markAsReady = async (order: Order) => {
    const updatedOrder = { ...order, status: 'Ready for Delivery' };
    await (window as any).electronAPI.updateOrder(updatedOrder);
    setOrders(orders.map((o) => (o._id === order._id ? updatedOrder : o)));
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-4">Kitchen View</h2>
      {orders
        .filter((order) => order.status === 'Sent to Kitchen')
        .map((order) => (
          <div key={order._id} className="mb-2 p-2 border rounded">
            <p><strong>Customer:</strong> {order.customer.name}</p>
            <p><strong>Items:</strong> {order.items}</p>
            <button
              onClick={() => markAsReady(order)}
              className="p-2 bg-blue-500 text-white rounded"
            >
              Mark as Ready
            </button>
          </div>
        ))}
    </div>
  );
};