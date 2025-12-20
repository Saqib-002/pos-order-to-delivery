import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { Vehicle, VehicleMaintenance } from "@/types/vehicles";
import CustomButton from "../components/ui/CustomButton";
import CustomInput from "../components/shared/CustomInput";
import { DeliveryPerson } from "@/types/delivery";

export const VehicleManagement = () => {
  const { auth } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DeliveryPerson[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<VehicleMaintenance[]>([]);
  
  // Form States
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    type: 'bike',
    hasGps: false
  });
  const [maintenanceForm, setMaintenanceForm] = useState<Partial<VehicleMaintenance>>({ unit: 1 });

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchVehicles = async () => {
    const res = await (window as any).electronAPI.getVehicles(auth.token);
    if (res.status) setVehicles(res.data);
  };

  const fetchDrivers = async () => {
    const res = await (window as any).electronAPI.getDeliveryPersons(auth.token);
    if (res.status) setDrivers(res.data);
  };

  const handleSave = async () => {
    if (!formData.model || !formData.licensePlate) {
      toast.error("Model and License Plate are required");
      return;
    }
    
    let res;
    if (selectedVehicle) {
      res = await (window as any).electronAPI.updateVehicle(auth.token, selectedVehicle.id, formData);
    } else {
      res = await (window as any).electronAPI.createVehicle(auth.token, formData);
    }

    if (res.status) {
      toast.success(selectedVehicle ? "Vehicle updated" : "Vehicle created");
      setShowModal(false);
      fetchVehicles();
    } else {
      toast.error(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    const res = await (window as any).electronAPI.deleteVehicle(auth.token, id);
    if (res.status) {
        toast.success("Vehicle deleted");
        fetchVehicles();
    }
  };

  const openMaintenance = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    const res = await (window as any).electronAPI.getVehicleMaintenance(auth.token, vehicle.id);
    if (res.status) setMaintenanceRecords(res.data);
    setShowMaintenanceModal(true);
  };

  const addMaintenance = async () => {
      if (!selectedVehicle) return;
      const total = (maintenanceForm.price || 0) * (maintenanceForm.unit || 1);
      const payload = { ...maintenanceForm, total, vehicleId: selectedVehicle.id };
      
      const res = await (window as any).electronAPI.addVehicleMaintenance(auth.token, payload);
      if(res.status) {
          toast.success("Maintenance record added");
          setMaintenanceForm({ unit: 1, sparePart: '', price: 0 });
          // Refresh list
          const updated = await (window as any).electronAPI.getVehicleMaintenance(auth.token, selectedVehicle.id);
          if(updated.status) setMaintenanceRecords(updated.data);
      }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vehicle Management</h1>
        <CustomButton type="button" onClick={() => { setSelectedVehicle(null); setFormData({type: 'bike', hasGps: false}); setShowModal(true); }} label="Add Vehicle"/>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates (ITV/Ins)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alerts</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td className="px-6 py-4">
                  <div className="font-bold">{vehicle.model} ({vehicle.type})</div>
                  <div className="text-sm text-gray-500">{vehicle.licensePlate}</div>
                  <div className="text-xs text-gray-400">GPS: {vehicle.hasGps ? "Yes" : "No"}</div>
                </td>
                <td className="px-6 py-4">{vehicle.driverName || "Unassigned"}</td>
                <td className="px-6 py-4 text-sm">
                   <div>ITV: {vehicle.itvDate ? new Date(vehicle.itvDate).toLocaleDateString() : 'N/A'}</div>
                   <div>Ins: {vehicle.insuranceDate ? new Date(vehicle.insuranceDate).toLocaleDateString() : 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                    {vehicle.alerts?.map((alert, i) => (
                        <span key={i} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1">{alert}</span>
                    ))}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openMaintenance(vehicle)} className="text-blue-600 hover:text-blue-900">Maintenance</button>
                  <button onClick={() => { setSelectedVehicle(vehicle); setFormData(vehicle); setShowModal(true); }} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  <button onClick={() => handleDelete(vehicle.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{selectedVehicle ? "Edit" : "Add"} Vehicle</h2>
            <div className="grid grid-cols-2 gap-4">
                <CustomInput 
                    name="model" 
                    type="text" 
                    label="Model" 
                    value={formData.model || ''} 
                    onChange={(e) => setFormData({...formData, model: e.target.value})} 
                />
                <CustomInput 
                    name="licensePlate" 
                    type="text" 
                    label="License Plate" 
                    value={formData.licensePlate || ''} 
                    onChange={(e) => setFormData({...formData, licensePlate: e.target.value})} 
                />
                <CustomInput 
                    name="color" 
                    type="text" 
                    label="Color" 
                    value={formData.color || ''} 
                    onChange={(e) => setFormData({...formData, color: e.target.value})} 
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select className="w-full border rounded p-2" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})}>
                        <option value="bike">Bike</option>
                        <option value="car">Car</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                    <select className="w-full border rounded p-2" value={formData.driverId || ''} onChange={(e) => setFormData({...formData, driverId: e.target.value})}>
                        <option value="">Select Driver</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center mt-6">
                    <input type="checkbox" checked={formData.hasGps} onChange={(e) => setFormData({...formData, hasGps: e.target.checked})} className="mr-2" />
                    <label>Has GPS</label>
                </div>
                <CustomInput 
                    name="itvDate" 
                    type="date" 
                    label="ITV Date" 
                    value={formData.itvDate ? new Date(formData.itvDate).toISOString().split('T')[0] : ''} 
                    onChange={(e) => setFormData({...formData, itvDate: e.target.value})} 
                />
                <CustomInput 
                    name="insuranceDate" 
                    type="date" 
                    label="Insurance Date" 
                    value={formData.insuranceDate ? new Date(formData.insuranceDate).toISOString().split('T')[0] : ''} 
                    onChange={(e) => setFormData({...formData, insuranceDate: e.target.value})} 
                />
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <CustomButton type="button" variant="secondary" onClick={() => setShowModal(false)} label="Cancel"/>
                <CustomButton type="button" onClick={handleSave} label="Save"/>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && selectedVehicle && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
           <h2 className="text-xl font-bold mb-4">Maintenance: {selectedVehicle.model}</h2>
           
           {/* Add New Record Form */}
           <div className="bg-gray-50 p-4 rounded mb-4 grid grid-cols-4 gap-2 items-end">
                <div className="col-span-2">
                    <CustomInput 
                        name="sparePart" 
                        type="text" 
                        label="Spare Part" 
                        value={maintenanceForm.sparePart || ''} 
                        onChange={(e) => setMaintenanceForm({...maintenanceForm, sparePart: e.target.value})} 
                    />
                </div>
                <CustomInput 
                    name="unit" 
                    type="number" 
                    label="Unit" 
                    value={maintenanceForm.unit?.toString() || '1'} 
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, unit: parseInt(e.target.value) || 0})} 
                />
                <CustomInput 
                    name="price" 
                    type="number" 
                    label="Price" 
                    value={maintenanceForm.price?.toString() || ''} 
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, price: parseFloat(e.target.value) || 0})} 
                />
                <div className="col-span-4 mt-2 text-right">
                     <CustomButton type="button" size="sm" onClick={addMaintenance}>Add Record</CustomButton>
                </div>
           </div>

           <div className="max-h-60 overflow-y-auto">
               <table className="min-w-full text-sm">
                   <thead>
                       <tr className="bg-gray-100">
                           <th className="p-2 text-left">Date</th>
                           <th className="p-2 text-left">Part</th>
                           <th className="p-2 text-right">Unit</th>
                           <th className="p-2 text-right">Price</th>
                           <th className="p-2 text-right">Total</th>
                       </tr>
                   </thead>
                   <tbody>
                       {maintenanceRecords.map(r => (
                           <tr key={r.id} className="border-b">
                               <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
                               <td className="p-2">{r.sparePart}</td>
                               <td className="p-2 text-right">{r.unit}</td>
                               <td className="p-2 text-right">{r.price?.toFixed(2)}€</td>
                               <td className="p-2 text-right">{r.total?.toFixed(2)}€</td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>

           <div className="mt-6 flex justify-end">
               <CustomButton type="button" variant="secondary" onClick={() => setShowMaintenanceModal(false)}>Close</CustomButton>
           </div>
         </div>
       </div>
      )}
    </div>
  );
};