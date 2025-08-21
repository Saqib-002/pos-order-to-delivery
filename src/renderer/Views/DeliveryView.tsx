import { useEffect, useState } from 'react';
import { Order } from '@/types/order';

export const DeliveryView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPerson, setDeliveryPerson] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const results = await (window as any).electronAPI.getOrders();
      setOrders(results);
    };
    fetchOrders();
  }, []);

  const assignDelivery = async (order: Order) => {
    if (!deliveryPerson) {
      alert('Please enter delivery person name');
      return;
    }
    const updatedOrder = { ...order, status: 'Out for Delivery', deliveryPerson };
    await (window as any).electronAPI.updateOrder(updatedOrder);
    setOrders(orders.map((o) => (o._id === order._id ? updatedOrder : o)));
    setDeliveryPerson('');
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-4">Delivery View</h2>
      <input
        type="text"
        placeholder="Delivery Person Name"
        value={deliveryPerson}
        onChange={(e) => setDeliveryPerson(e.target.value)}
        className="mb-2 p-2 border rounded w-full"
      />
      {orders
        .filter((order) => order.status === 'Ready for Delivery')
        .map((order) => (
          <div key={order._id} className="mb-2 p-2 border rounded">
            <p><strong>Customer:</strong> {order.customer.name}</p>
            <p><strong>Address:</strong> {order.customer.address}</p>
            <p><strong>Items:</strong> {order.items.map((item) => item.name).join(', ')}</p>
            <button
              onClick={() => assignDelivery(order)}
              className="p-2 bg-green-500 text-white rounded"
            >
              Assign Delivery
            </button>
          </div>
        ))}
    </div>
  );
};