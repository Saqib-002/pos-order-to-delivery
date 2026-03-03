import React from "react";
import { useTranslation } from "react-i18next";
import { Vehicle } from "@/types/vehicles";
import CustomButton from "../ui/CustomButton";
import { Car, Bike, LocateFixed, Toolbox } from "lucide-react";
import {
  ExclamationIcon,
  EditIcon,
  DeleteIcon,
  MotorcycleIcon,
} from "../../public/Svg";
import dayjs from "dayjs";

interface VehicleTableProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  onMaintenance: (vehicle: Vehicle) => void;
}

const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return "-";
  return dayjs(new Date(dateString).toLocaleDateString()).format("DD/MM/YYYY");
};

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  onEdit,
  onDelete,
  onMaintenance,
}) => {
  const { t } = useTranslation();

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="size-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-black">
          {t("vehicleManagement.table.noVehiclesFound")}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t("vehicleManagement.table.getStartedMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              {t("vehicleManagement.table.vehicle")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              {t("vehicleManagement.table.gpsColor")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              {t("vehicleManagement.table.status")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              {t("vehicleManagement.table.itvDate")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              {t("vehicleManagement.table.insurance")}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              {t("vehicleManagement.table.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="shrink-0 h-12 w-12 bg-linear-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                    {vehicle.type === "bike" ? (
                      <MotorcycleIcon className="size-6 text-blue-600" />
                    ) : (
                      <Car className="size-6 text-green-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-semibold text-black">
                      {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                      {vehicle.licensePlate}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  {vehicle.hasGps && (
                    <LocateFixed className="size-4 text-black" />
                  )}
                  {vehicle.color && (
                    <span className="capitalize">{vehicle.color}</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium w-max ${
                        vehicle.driverName
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {vehicle.driverName
                        ? t("vehicleManagement.table.assigned")
                        : t("vehicleManagement.table.unassigned")}
                    </span>
                  </div>
                  {vehicle.driverName && (
                    <div className="text-xs text-gray-600 font-medium">
                      {t("vehicleManagement.table.driver")}:{" "}
                      {vehicle.driverName}
                    </div>
                  )}
                  {vehicle.alerts && vehicle.alerts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {vehicle.alerts.map((alert, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded"
                        >
                          <ExclamationIcon className="size-3" /> {alert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm">
                <div
                  className={`font-medium ${new Date(vehicle.itvDate || "") < new Date() ? "text-red-600" : "text-gray-700"}`}
                >
                  {formatDate(vehicle.itvDate)}
                </div>
              </td>
              <td className="px-6 py-4 text-sm">
                <div
                  className={`font-medium ${new Date(vehicle.insuranceDate || "") < new Date() ? "text-red-600" : "text-gray-700"}`}
                >
                  {formatDate(vehicle.insuranceDate)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-1">
                <CustomButton
                  type="button"
                  variant="transparent"
                  onClick={() => onMaintenance(vehicle)}
                  Icon={<Toolbox className="size-5" />}
                  className="text-orange-600 hover:text-orange-900 hover:bg-orange-50 hover:scale-105 px-3! py-2! rounded-lg transition-all duration-200"
                  title="View Maintenance Records"
                />
                <CustomButton
                  type="button"
                  variant="transparent"
                  onClick={() => onEdit(vehicle)}
                  Icon={<EditIcon className="size-5" />}
                  className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 hover:scale-105 px-3! py-2! rounded-lg transition-all duration-200"
                  title="Edit Vehicle"
                />
                <CustomButton
                  type="button"
                  variant="transparent"
                  onClick={() => onDelete(vehicle.id)}
                  Icon={<DeleteIcon className="size-5" />}
                  className="text-red-600 hover:text-red-900 hover:bg-red-50 hover:scale-105 px-3! py-2! rounded-lg transition-all duration-200"
                  title="Delete Vehicle"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
