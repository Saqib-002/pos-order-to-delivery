import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Vehicle,
  VehicleMaintenance,
  MaintenanceFilters,
  PaginatedResult,
} from "@/types/vehicles";
import CustomButton from "../../ui/CustomButton";
import CustomInput from "../../shared/CustomInput";
import Pagination from "../../shared/Pagination";
import {
  CrossIcon,
  SearchIcon,
  EditIcon,
  DeleteIcon,
} from "../../../public/Svg";
import { useConfirm } from "../../../hooks/useConfirm";

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onAddRecord: (
    vehicleId: string,
    data: Partial<VehicleMaintenance>
  ) => Promise<boolean>;
  onUpdateRecord: (
    maintenanceId: string,
    data: Partial<VehicleMaintenance>
  ) => Promise<boolean>;
  onDeleteRecord: (maintenanceId: string) => Promise<boolean>;
  fetchRecords: (
    vehicleId: string,
    filters: MaintenanceFilters
  ) => Promise<PaginatedResult<VehicleMaintenance>>;
}

interface MaintenanceForm {
  sparePart: string;
  unit: string;
  price: string;
}

const INITIAL_FILTERS: MaintenanceFilters = {
  page: 1,
  pageSize: 5,
  search: "",
  minPrice: undefined,
  maxPrice: undefined,
};

const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB"); // dd/mm/yyyy
};

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  fetchRecords,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [data, setData] = useState<PaginatedResult<VehicleMaintenance>>({
    data: [],
    pagination: { total: 0, page: 1, pageSize: 5, totalPages: 0 },
  });
  const [filters, setFilters] = useState<MaintenanceFilters>(INITIAL_FILTERS);
  const [form, setForm] = useState<MaintenanceForm>({
    unit: "1",
    sparePart: "",
    price: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && vehicle) {
      setFilters(INITIAL_FILTERS);
      resetForm();
      loadRecords(INITIAL_FILTERS);
    }
  }, [isOpen, vehicle]);

  const resetForm = () => {
    setForm({ unit: "1", sparePart: "", price: "" });
    setEditingId(null);
  };

  const loadRecords = async (currentFilters: MaintenanceFilters) => {
    if (vehicle) {
      const result = await fetchRecords(vehicle.id, currentFilters);
      setData(result);
    }
  };

  const handleFilterChange = (key: keyof MaintenanceFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    loadRecords(newFilters);
  };

  const handlePageChange = (zeroIndexedPage: number) => {
    const newFilters = { ...filters, page: zeroIndexedPage + 1 };
    setFilters(newFilters);
    loadRecords(newFilters);
  };

  const handleSubmit = async () => {
    if (!vehicle || !form.sparePart || !form.price) return;

    const priceVal = parseFloat(form.price);
    const unitVal = parseInt(form.unit);
    if (isNaN(priceVal)) return;

    const payload = {
      sparePart: form.sparePart,
      price: priceVal,
      unit: isNaN(unitVal) ? 1 : unitVal,
    };

    let success = false;
    if (editingId) {
      success = await onUpdateRecord(editingId, payload);
    } else {
      success = await onAddRecord(vehicle.id, payload);
    }

    if (success) {
      resetForm();
      loadRecords(filters);
    }
  };

  const handleEdit = (record: VehicleMaintenance) => {
    setForm({
      sparePart: record.sparePart,
      unit: record.unit.toString(),
      price: record.price.toString(),
    });
    setEditingId(record.id);
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t("vehicleManagement.maintenanceModal.deleteTitle"),
        message: t("vehicleManagement.maintenanceModal.deleteMessage"),
        confirmText: t("common.delete"),
        type: "danger",
      })
    ) {
      const success = await onDeleteRecord(id);
      if (success) loadRecords(filters);
    }
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">
                {t("vehicleManagement.maintenanceModal.title")}
              </h3>
              <p className="text-sm text-gray-300 opacity-90">
                {vehicle.model} - {vehicle.licensePlate}
              </p>
            </div>
            <CustomButton
              type="button"
              variant="transparent"
              onClick={onClose}
              Icon={<CrossIcon className="size-6" />}
              className="text-white hover:text-gray-500 !p-2 !rounded-full hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col">
          {/* Add/Edit Record Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 flex-shrink-0">
            <h4 className="font-semibold mb-3 text-sm text-black uppercase tracking-wider">
              {editingId
                ? t("vehicleManagement.maintenanceModal.editRecord")
                : t("vehicleManagement.maintenanceModal.addNewRecord")}
            </h4>
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-5">
                <CustomInput
                  name="sparePart"
                  type="text"
                  label={t("vehicleManagement.maintenanceModal.sparePart")}
                  placeholder={t(
                    "vehicleManagement.maintenanceModal.sparePartPlaceholder"
                  )}
                  value={form.sparePart}
                  onChange={(e) =>
                    setForm({ ...form, sparePart: e.target.value })
                  }
                  inputClasses="bg-white py-2"
                />
              </div>
              <div className="col-span-2">
                <CustomInput
                  name="unit"
                  type="number"
                  label={t("vehicleManagement.maintenanceModal.unit")}
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  inputClasses="bg-white py-2"
                />
              </div>
              <div className="col-span-3">
                <CustomInput
                  name="price"
                  type="number"
                  label={t("vehicleManagement.maintenanceModal.price")}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  inputClasses="bg-white py-2"
                />
              </div>
              <div className="col-span-2 flex gap-1">
                <CustomButton
                  type="button"
                  onClick={handleSubmit}
                  label={
                    editingId
                      ? t("vehicleManagement.maintenanceModal.save")
                      : t("vehicleManagement.maintenanceModal.add")
                  }
                  className={`flex-1 justify-center ${editingId ? "bg-blue-600 hover:bg-blue-700" : "bg-black hover:bg-gray-800"} text-white py-2`}
                />
                {editingId && (
                  <CustomButton
                    type="button"
                    onClick={resetForm}
                    label="X"
                    className="bg-gray-200 text-black hover:bg-gray-300 py-2 px-3"
                    title={t("vehicleManagement.maintenanceModal.cancelEdit")}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-shrink-0">
            <div className="flex-1">
              <CustomInput
                name="search"
                type="text"
                placeholder={t(
                  "vehicleManagement.maintenanceModal.searchPlaceholder"
                )}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                preLabel={<SearchIcon className="size-4 text-gray-400" />}
                inputClasses="pl-8 py-2 text-sm"
              />
            </div>
            <div className="w-32">
              <CustomInput
                name="minPrice"
                type="number"
                placeholder={t("vehicleManagement.maintenanceModal.minPrice")}
                value={filters.minPrice || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "minPrice",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                inputClasses="py-2 text-sm"
              />
            </div>
            <div className="w-32">
              <CustomInput
                name="maxPrice"
                type="number"
                placeholder={t("vehicleManagement.maintenanceModal.maxPrice")}
                value={filters.maxPrice || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "maxPrice",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                inputClasses="py-2 text-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 rounded-lg overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-500">
                      {t("vehicleManagement.maintenanceModal.table.date")}
                    </th>
                    <th className="p-3 text-left font-medium text-gray-500">
                      {t(
                        "vehicleManagement.maintenanceModal.table.servicePart"
                      )}
                    </th>
                    <th className="p-3 text-right font-medium text-gray-500">
                      {t("vehicleManagement.maintenanceModal.table.unit")}
                    </th>
                    <th className="p-3 text-right font-medium text-gray-500">
                      {t("vehicleManagement.maintenanceModal.table.price")}
                    </th>
                    <th className="p-3 text-right font-medium text-gray-500">
                      {t("vehicleManagement.maintenanceModal.table.total")}
                    </th>
                    <th className="p-3 text-right font-medium text-gray-500 w-24">
                      {t("vehicleManagement.maintenanceModal.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        {t(
                          "vehicleManagement.maintenanceModal.table.noRecordsFound"
                        )}
                      </td>
                    </tr>
                  ) : (
                    data.data.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-600">
                          {formatDate(r.date)}
                        </td>
                        <td className="p-3 font-medium text-black">
                          {r.sparePart}
                        </td>
                        <td className="p-3 text-right text-gray-600">
                          {r.unit}
                        </td>
                        <td className="p-3 text-right text-gray-600">
                          {Number(r.price).toFixed(2)}€
                        </td>
                        <td className="p-3 text-right font-semibold text-black">
                          {Number(r.total).toFixed(2)}€
                        </td>
                        <td className="p-3 text-right flex justify-end gap-1">
                          <CustomButton
                            type="button"
                            variant="transparent"
                            onClick={() => handleEdit(r)}
                            Icon={<EditIcon className="size-4" />}
                            className="text-black hover:text-blue-600 !p-1.5"
                            title="Edit"
                          />
                          <CustomButton
                            type="button"
                            variant="transparent"
                            onClick={() => handleDelete(r.id)}
                            Icon={<DeleteIcon className="size-4" />}
                            className="text-red-500 hover:text-red-700 !p-1.5"
                            title="Delete"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex-shrink-0">
            <Pagination
              currentPage={data.pagination.page - 1}
              totalPages={data.pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
