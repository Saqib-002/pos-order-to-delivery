import { useState } from "react";
import { useConfirm } from "../hooks/useConfirm";
import { useVehicleData } from "../hooks/useVehicleData";
import { Vehicle } from "@/types/vehicles";

// Components
import CustomButton from "../components/ui/CustomButton";
import CustomInput from "../components/shared/CustomInput";
import { CustomSelect } from "../components/ui/CustomSelect";
import Pagination from "../components/shared/Pagination";
import { VehicleTable } from "../components/vehicle/VehicleTable";
import { VehicleModal } from "../components/vehicle/modals/VehicleModal";
import { MaintenanceModal } from "../components/vehicle/modals/MaintenanceModal";

// Icons
import { AddIcon, SearchIcon } from "../public/Svg";

export const VehicleManagement = () => {
  const confirm = useConfirm();
  const {
    vehiclesData,
    drivers,
    loading,
    vehicleFilters,
    setVehicleFilters,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
    fetchMaintenanceRecords,
  } = useVehicleData();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "add" | "edit" | "maintenance";
    vehicle: Vehicle | null;
  }>({ isOpen: false, type: "add", vehicle: null });

  // --- Filter Handlers ---
  const handleFilterChange = (key: string, value: any) => {
    setVehicleFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (zeroIndexedPage: number) => {
    setVehicleFilters(prev => ({ ...prev, page: zeroIndexedPage + 1 }));
  };

  // --- Modal Handlers ---
  const handleOpenAdd = () => setModalState({ isOpen: true, type: "add", vehicle: null });
  const handleOpenEdit = (vehicle: Vehicle) => setModalState({ isOpen: true, type: "edit", vehicle });
  const handleOpenMaintenance = (vehicle: Vehicle) => setModalState({ isOpen: true, type: "maintenance", vehicle });
  const handleClose = () => setModalState({ ...modalState, isOpen: false });

  const handleSaveVehicle = async (data: Partial<Vehicle>) => {
    const result = modalState.type === "edit" && modalState.vehicle
      ? await updateVehicle(modalState.vehicle.id, data)
      : await createVehicle(data);
    return result;
  };

  const handleDelete = async (id: string) => {
    if (await confirm({ title: "Delete Vehicle", message: "Are you sure?", confirmText: "Delete", type: "danger" })) {
        await deleteVehicle(id);
    }
  };

  // --- Options ---
  const driverOptions = [
      { value: '', label: 'All Drivers' },
      { value: 'unassigned', label: 'Unassigned' },
      ...drivers.map(d => ({ value: d.id, label: d.name }))
  ];

  const typeOptions = [
      { value: 'all', label: 'All Types' },
      { value: 'bike', label: 'Bike' },
      { value: 'car', label: 'Car' }
  ];

  const alertOptions = [
      { value: 'all', label: 'All Status' },
      { value: 'has_alerts', label: 'Has Alerts' },
      { value: 'expiring_soon', label: 'Expiring Soon' },
      { value: 'expired', label: 'Expired' }
  ];

  if (loading && vehiclesData.data.length === 0) {
    return <div className="flex justify-center min-h-screen items-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div></div>;
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">Vehicle Management</h2>
          <p className="text-gray-600 mt-1">Manage your fleet and maintenance</p>
        </div>
        <CustomButton type="button" onClick={handleOpenAdd} label="Add Vehicle" Icon={<AddIcon className="size-5" />} />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                  <CustomInput
                      name="search"
                      type="text"
                      placeholder="Search Model/Plate..."
                      value={vehicleFilters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      preLabel={<SearchIcon className="size-5 text-gray-400" />}
                      inputClasses="pl-8"
                      secLabelClasses="top-3 left-1.5!"
                  />
              </div>
              <CustomSelect
                  options={typeOptions}
                  value={vehicleFilters.type || 'all'}
                  onChange={(val) => handleFilterChange('type', val)}
                  placeholder="Type"
              />
              <CustomSelect
                  options={driverOptions}
                  value={vehicleFilters.driverId || ''}
                  onChange={(val) => handleFilterChange('driverId', val)}
                  placeholder="Driver"
              />
              <CustomSelect
                  options={alertOptions}
                  value={vehicleFilters.alertStatus || 'all'}
                  onChange={(val) => handleFilterChange('alertStatus', val)}
                  placeholder="Status"
              />
              <div className="flex items-center justify-center border rounded-lg bg-gray-50 px-4">
                 <label className="flex items-center cursor-pointer gap-2">
                     <input 
                        type="checkbox" 
                        className="w-4 h-4 text-black rounded focus:ring-black accent-black"
                        checked={vehicleFilters.hasGps === true}
                        ref={(input) => {
                            if (input) input.indeterminate = vehicleFilters.hasGps === null;
                        }}
                        onChange={() => {
                            const nextState = vehicleFilters.hasGps === null ? true : (vehicleFilters.hasGps === true ? false : null);
                            handleFilterChange('hasGps', nextState);
                        }}
                     />
                     <span className="text-sm font-medium text-gray-700">
                         GPS: {vehicleFilters.hasGps === null ? 'All' : (vehicleFilters.hasGps ? 'Yes' : 'No')}
                     </span>
                 </label>
              </div>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-black">Vehicles ({vehiclesData.pagination.total})</h3>
          {loading && <span className="text-sm text-gray-500 animate-pulse">Updating...</span>}
        </div>
        
        <div className="flex-grow">
            <VehicleTable
              vehicles={vehiclesData.data}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onMaintenance={handleOpenMaintenance}
            />
        </div>

        <div className="p-4 border-t border-gray-200">
            <Pagination
                currentPage={vehiclesData.pagination.page - 1}
                totalPages={vehiclesData.pagination.totalPages}
                onPageChange={handlePageChange}
            />
        </div>
      </div>

      {/* Modals */}
      <VehicleModal
        isOpen={modalState.isOpen && modalState.type !== "maintenance"}
        onClose={handleClose}
        onSubmit={handleSaveVehicle}
        initialData={modalState.type === "edit" ? modalState.vehicle : null}
        drivers={drivers}
      />

      <MaintenanceModal
        isOpen={modalState.isOpen && modalState.type === "maintenance"}
        onClose={handleClose}
        vehicle={modalState.vehicle}
        onAddRecord={addMaintenance}
        onUpdateRecord={updateMaintenance}
        onDeleteRecord={deleteMaintenance}
        fetchRecords={fetchMaintenanceRecords}
      />
    </div>
  );
};