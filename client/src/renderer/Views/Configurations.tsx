import { useState } from 'react';
import Printers from '../components/configurations/Printers';
import ConfigurationsTab from '../components/configurations/ConfiguraionsTab';

const Configurations = () => {
  const [currentSubview, setCurrentSubview] = useState('printers');

  const renderSubview = () => {
    switch (currentSubview) {
      case 'printers':
        return <Printers />;
      case 'config':
        return <ConfigurationsTab/>;
      default:
        return <Printers />;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '2px solid #ccc', marginBottom: '20px' }}>
        <button
          onClick={() => setCurrentSubview('printers')}
          className={`px-5 py-3 ${currentSubview === 'printers' ? 'border-b-2 border-indigo-600 ' : ' text-gray-700 hover:bg-gray-200 cursor-pointer'} touch-manipulation transition-colors duration-300`}
        >
          Printers
        </button>
        <button
          onClick={() => setCurrentSubview('config')}
          className={`px-5 py-3 ${currentSubview === 'config' ? 'border-b-2 border-indigo-600 ' : ' text-gray-700 hover:bg-gray-200 cursor-pointer'} touch-manipulation transition-colors duration-300`}
        >
          Configurations
        </button>
      </div>
      <div>
        {renderSubview()}
      </div>
    </div>
  );
};

export default Configurations;