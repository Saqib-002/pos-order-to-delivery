import { useEffect, useState } from 'react';
import { Order } from '@/types/order';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const result = await (window as any).electronAPI.getOrders();
      setOrders(result.rows.map((row: any) => row.doc));
    };
    fetchOrders();
  }, []);

  return (
    <div className="mt-4 bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-4">All Orders</h2>
      {orders.map((order) => (
        <div key={order._id} className="mb-2 p-2 border rounded">
          <p><strong>Customer:</strong> {order.customer.name}</p>
          <p><strong>Phone:</strong> {order.customer.phone}</p>
          <p><strong>Address:</strong> {order.customer.address}</p>
          <p><strong>Items:</strong> {order.items}</p>
          <p><strong>Status:</strong> {order.status}</p>
        </div>
      ))}
    </div>
  );
};