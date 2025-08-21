import { useEffect, useState } from 'react';
import { Order } from '@/types/order';

export const ReportView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchOrders = async () => {
      const results = await (window as any).electronAPI.getOrders();
      setOrders(results);
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(
    (order) => order.createdAt.split('T')[0] === date
  );

  const totalSales = filteredOrders.length;
  const deliveredOrders = filteredOrders.filter(
    (order) => order.status === 'Out for Delivery'
  ).length;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-4">Daily Reports</h2>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 p-2 border rounded"
      />
      <p><strong>Total Orders:</strong> {totalSales}</p>
      <p><strong>Delivered Orders:</strong> {deliveredOrders}</p>
      <h3 className="mt-4">Order Details</h3>
      {filteredOrders.map((order) => (
        <div key={order._id} className="mb-2 p-2 border rounded">
          <p><strong>Customer:</strong> {order.customer.name}</p>
          <p><strong>Items:</strong> {order.items.map((item) => item.name).join(', ')}</p>
          <p><strong>Status:</strong> {order.status}</p>
        </div>
      ))}
    </div>
  );
};