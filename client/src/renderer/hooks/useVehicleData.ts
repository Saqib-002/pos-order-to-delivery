import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Vehicle, VehicleMaintenance, VehicleFilters, MaintenanceFilters, PaginatedResult } from "@/types/vehicles";
import { DeliveryPerson } from "@/types/delivery";
import { useAuth } from "../contexts/AuthContext";

const INITIAL_VEHICLE_FILTERS: VehicleFilters = {
    page: 1,
    pageSize: 10,
    search: '',
    type: 'all',
    alertStatus: 'all',
    driverId: '',
    hasGps: null
};

export const useVehicleData = () => {
  const { auth } = useAuth();
  
  // Data State
  const [vehiclesData, setVehiclesData] = useState<PaginatedResult<Vehicle>>({ data: [], pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 } });
  const [drivers, setDrivers] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [vehicleFilters, setVehicleFilters] = useState<VehicleFilters>(INITIAL_VEHICLE_FILTERS);

  const fetchVehicles = useCallback(async () => {
    const res = await (window as any).electronAPI.getVehicles(auth.token, vehicleFilters);
    if (res.status) setVehiclesData(res.data);
    else toast.error(res.error || "Failed to fetch vehicles");
  }, [auth.token, vehicleFilters]);

  const fetchDrivers = useCallback(async () => {
    const res = await (window as any).electronAPI.getDeliveryPersons(auth.token);
    if (res.status) setDrivers(res.data);
  }, [auth.token]);

  useEffect(() => {
    Promise.all([fetchVehicles(), fetchDrivers()]).finally(() => setLoading(false));
  }, [fetchVehicles, fetchDrivers]);

  // CRUD Operations
  const createVehicle = async (data: Partial<Vehicle>) => {
    const res = await (window as any).electronAPI.createVehicle(auth.token, data);
    if (res.status) { toast.success("Vehicle created"); fetchVehicles(); return true; }
    toast.error(res.error); return false;
  };

  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    const res = await (window as any).electronAPI.updateVehicle(auth.token, id, data);
    if (res.status) { toast.success("Vehicle updated"); fetchVehicles(); return true; }
    toast.error(res.error); return false;
  };

  const deleteVehicle = async (id: string) => {
    const res = await (window as any).electronAPI.deleteVehicle(auth.token, id);
    if (res.status) { toast.success("Vehicle deleted"); fetchVehicles(); return true; }
    toast.error(res.error); return false;
  };

  // --- Maintenance Operations ---

  const addMaintenance = async (vehicleId: string, data: Partial<VehicleMaintenance>) => {
     const total = (data.price || 0) * (data.unit || 1);
     const res = await (window as any).electronAPI.addVehicleMaintenance(auth.token, { ...data, total, vehicleId });
     if(res.status) { toast.success("Maintenance record added"); return true; }
     toast.error(res.error); return false;
  };

  const updateMaintenance = async (maintenanceId: string, data: Partial<VehicleMaintenance>) => {
    const total = (data.price || 0) * (data.unit || 1);
    const res = await (window as any).electronAPI.updateVehicleMaintenance(auth.token, maintenanceId, { ...data, total });
    if(res.status) { toast.success("Maintenance record updated"); return true; }
    toast.error(res.error); return false;
  };

  const deleteMaintenance = async (maintenanceId: string) => {
    const res = await (window as any).electronAPI.deleteVehicleMaintenance(auth.token, maintenanceId);
    if(res.status) { toast.success("Maintenance record deleted"); return true; }
    toast.error(res.error); return false;
  };

  const fetchMaintenanceRecords = async (vehicleId: string, filters: MaintenanceFilters) => {
      const res = await (window as any).electronAPI.getVehicleMaintenance(auth.token, vehicleId, filters);
      if (res.status) return res.data;
      return { data: [], pagination: { total: 0, page: 1, pageSize: 5, totalPages: 0 } };
  };

  return {
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
    fetchMaintenanceRecords
  };
};