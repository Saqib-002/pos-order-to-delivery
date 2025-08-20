import { useState } from 'react';
import { Order } from '@/types/order';

export const OrderForm: React.FC = () => {
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [items, setItems] = useState('');

  const handleSubmit = async () => {
    const order: Order = {
      _id: new Date().toISOString(),
      customer,
      items,
      status:"Sent to Kitchen",
      createdAt: new Date().toISOString(),
    };
    await (window as any).electronAPI.saveOrder(order);
    setCustomer({ name: '', phone: '', address: '' });
    setItems('');
    alert('Order saved!');
  };

  const sendToKitchen = async () => {
    await handleSubmit();
    // Simulate printing to kitchen
    console.log('Order sent to kitchen:', { customer, items });
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-4">New Order</h2>
      <input
        type="text"
        placeholder="Customer Name"
        value={customer.name}
        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
        className="mb-2 p-2 border rounded w-full"
      />
      <input
        type="text"
        placeholder="Phone Number"
        value={customer.phone}
        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
        className="mb-2 p-2 border rounded w-full"
      />
      <input
        type="text"
        placeholder="Address"
        value={customer.address}
        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
        className="mb-2 p-2 border rounded w-full"
      />
      <textarea
        placeholder="Order Items"
        value={items}
        onChange={(e) => setItems(e.target.value)}
        className="mb-2 p-2 border rounded w-full"
      />
      <button
        onClick={sendToKitchen}
        className="p-2 bg-green-500 text-white rounded"
      >
        Send to Kitchen
      </button>
    </div>
  );
};