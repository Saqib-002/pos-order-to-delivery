import { useState } from 'react';
import { OrderForm } from '@/renderer/components/OrderForm';
import { OrderList } from '@/renderer/components/OrderList';
import { KitchenView } from '@/renderer/components/KitchenView';
import { DeliveryView } from '@/renderer/components/DeliveryView';
import { ReportView } from '@/renderer/components/ReportView';

const App: React.FC = () => {
  const [view, setView] = useState('order');

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <nav className="mb-4">
        <button
          className="mr-2 p-2 bg-blue-500 text-white rounded"
          onClick={() => setView('order')}
        >
          Order Taking
        </button>
        <button
          className="mr-2 p-2 bg-blue-500 text-white rounded"
          onClick={() => setView('kitchen')}
        >
          Kitchen View
        </button>
        <button
          className="mr-2 p-2 bg-blue-500 text-white rounded"
          onClick={() => setView('delivery')}
        >
          Delivery View
        </button>
        <button
          className="p-2 bg-blue-500 text-white rounded"
          onClick={() => setView('reports')}
        >
          Reports
        </button>
      </nav>
      {view === 'order' && <OrderForm />}
      {view === 'kitchen' && <KitchenView />}
      {view === 'delivery' && <DeliveryView />}
      {view === 'reports' && <ReportView />}
      <OrderList />
    </div>
  );
};

export default App;