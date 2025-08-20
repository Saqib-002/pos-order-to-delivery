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
    const handleChange = (change: any) => {
      if (change.doc) {
        setOrders((prevOrders) => {
          const updatedOrders = [...prevOrders];
          const index = updatedOrders.findIndex((order) => order._id === change.id);
          if (index !== -1) {
            // Update existing order
            updatedOrders[index] = change.doc;
          } else if (!change.deleted) {
            // Add new order
            updatedOrders.push(change.doc);
          } else {
            // Remove deleted order
            return updatedOrders.filter((order) => order._id !== change.id);
          }
          return updatedOrders;
        });
      } else if (change.deleted) {
        // Handle deletion when doc is not included
        setOrders((prevOrders) => prevOrders.filter((order) => order._id !== change.id));
      } else {
        // Fallback: refresh all orders
        (window as any).electronAPI.getOrders().then((result: any) => {
          setOrders(result.rows.map((row: any) => row.doc));
        }).catch((err: any) => {
          console.error('Error refreshing orders:', err);
        });
      }
    };

    // Register change listener and get cleanup function
    const cleanup = (window as any).electronAPI.onDbChange(handleChange);

    // Cleanup listener on unmount
    return () => {
      cleanup();
    };
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