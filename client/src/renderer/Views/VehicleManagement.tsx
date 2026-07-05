import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    addMultipleMaintenance,
    updateMaintenance,
    updateMultipleMaintenancePayments,
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
    setVehicleFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (zeroIndexedPage: number) => {
    setVehicleFilters((prev) => ({ ...prev, page: zeroIndexedPage + 1 }));
  };

  // --- Modal Handlers ---
  const handleOpenAdd = () =>
    setModalState({ isOpen: true, type: "add", vehicle: null });
  const handleOpenEdit = (vehicle: Vehicle) =>
    setModalState({ isOpen: true, type: "edit", vehicle });
  const handleOpenMaintenance = (vehicle: Vehicle) =>
    setModalState({ isOpen: true, type: "maintenance", vehicle });
  const handleClose = () => setModalState({ ...modalState, isOpen: false });

  const handleSaveVehicle = async (data: Partial<Vehicle>) => {
    const result =
      modalState.type === "edit" && modalState.vehicle
        ? await updateVehicle(modalState.vehicle.id, data)
        : await createVehicle(data);
    return result;
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t("vehicleManagement.deleteConfirm.title"),
        message: t("vehicleManagement.deleteConfirm.message"),
        confirmText: t("common.delete"),
        type: "danger",
      })
    ) {
      await deleteVehicle(id);
    }
  };

  // --- Options ---
  const driverOptions = [
    { value: "", label: t("vehicleManagement.filters.allDrivers") },
    { value: "unassigned", label: t("vehicleManagement.filters.unassigned") },
    ...drivers.map((d) => ({ value: d.id, label: d.name })),
  ];

  const typeOptions = [
    { value: "all", label: t("vehicleManagement.filters.allTypes") },
    { value: "bike", label: t("vehicleManagement.filters.bike") },
    { value: "motorcycle", label: t("vehicleManagement.filters.motorcycle") },
    { value: "car", label: t("vehicleManagement.filters.car") },
    { value: "scooter", label: t("vehicleManagement.filters.scooter") },
    { value: "van", label: t("vehicleManagement.filters.van") },
  ];

  const alertOptions = [
    { value: "all", label: t("vehicleManagement.filters.allStatus") },
    { value: "has_alerts", label: t("vehicleManagement.filters.hasAlerts") },
    {
      value: "expiring_soon",
      label: t("vehicleManagement.filters.expiringSoon"),
    },
    { value: "expired", label: t("vehicleManagement.filters.expired") },
  ];

  const gpsOptions = [
    { value: "all", label: t("vehicleManagement.filters.all") },
    { value: "yes", label: t("vehicleManagement.filters.yes") },
    { value: "no", label: t("vehicleManagement.filters.no") },
  ];

  const handleClearFilters = () => {
    setVehicleFilters({
      page: 1,
      pageSize: 10,
      search: "",
      type: "all",
      driverId: "",
      alertStatus: "all",
      hasGps: null,
    });
  };

  if (loading && vehiclesData.data.length === 0) {
    return (
      <div className="flex justify-center min-h-screen items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">
            {t("vehicleManagement.title")}
          </h2>
          <p className="text-gray-600 mt-1">
            {t("vehicleManagement.subtitle")}
          </p>
        </div>
        <CustomButton
          type="button"
          onClick={handleOpenAdd}
          label={t("vehicleManagement.addVehicle")}
          Icon={<AddIcon className="size-5" />}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 flex-1">
            <div className="sm:col-span-1 lg:col-span-1">
              <CustomInput
                name="search"
                type="text"
                placeholder={t("vehicleManagement.searchPlaceholder")}
                value={vehicleFilters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                preLabel={<SearchIcon className="size-5 text-gray-400" />}
                inputClasses="pl-8"
                secLabelClasses="top-3 left-1.5!"
              />
            </div>
            <CustomSelect
              options={typeOptions}
              value={vehicleFilters.type || "all"}
              onChange={(val) => handleFilterChange("type", val)}
              placeholder={t("vehicleManagement.filters.type")}
            />
            <CustomSelect
              options={driverOptions}
              value={vehicleFilters.driverId || ""}
              onChange={(val) => handleFilterChange("driverId", val)}
              placeholder={t("vehicleManagement.filters.driver")}
            />
            <CustomSelect
              options={alertOptions}
              value={vehicleFilters.alertStatus || "all"}
              onChange={(val) => handleFilterChange("alertStatus", val)}
              placeholder={t("vehicleManagement.filters.status")}
            />
            <div className="flex items-center justify-center">
              <label className="flex items-center cursor-pointer gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {t("vehicleManagement.filters.gps")}
                </span>
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    vehicleFilters.hasGps ? "bg-green-500" : "bg-gray-200"
                  }`}
                  onClick={() =>
                    handleFilterChange("hasGps", !vehicleFilters.hasGps)
                  }
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      vehicleFilters.hasGps ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>
          <div className="shrink-0">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={handleClearFilters}
              label={t("vehicleManagement.filters.clearFilters")}
              className="hover:scale-105 whitespace-nowrap"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-125">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-black">
            {t("vehicleManagement.table.vehicles")} (
            {vehiclesData.pagination.total})
          </h3>
          {loading && (
            <span className="text-sm text-gray-500 animate-pulse">
              {t("vehicleManagement.table.updating")}
            </span>
          )}
        </div>

        <div className="grow">
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
        onAddMultipleRecords={addMultipleMaintenance}
        onUpdateRecord={updateMaintenance}
        onUpdateMultiplePayments={updateMultipleMaintenancePayments}
        onDeleteRecord={deleteMaintenance}
        fetchRecords={fetchMaintenanceRecords}
      />
    </div>
  );
};
