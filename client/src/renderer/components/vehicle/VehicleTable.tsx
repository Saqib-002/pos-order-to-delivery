import React from "react";
import { Vehicle } from "@/types/vehicles";
import CustomButton from "../ui/CustomButton";
import {
  CarIcon,
  MotorcycleIcon,
  LocationIcon,
  ExclamationIcon,
  ClipboardIcon,
  EditIcon,
  DeleteIcon,
} from "../../public/Svg";

interface VehicleTableProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  onMaintenance: (vehicle: Vehicle) => void;
}

const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
};

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  onEdit,
  onDelete,
  onMaintenance,
}) => {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <CarIcon className="size-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-black">
          No vehicles found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a new vehicle to your fleet.
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
              Vehicle
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Dates
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {vehicle.type === "bike" ? (
                      <MotorcycleIcon className="size-5 text-gray-600" />
                    ) : (
                      <CarIcon className="size-5 text-gray-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-black">
                      {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vehicle.licensePlate}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  {vehicle.hasGps && (
                    <LocationIcon className="size-4 text-blue-500" />
                  )}
                  {vehicle.color && (
                    <span className="capitalize">{vehicle.color}</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  {vehicle.driverName ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-max">
                      {vehicle.driverName}
                    </span>
                  ) : (
                    <span className="w-max inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Unassigned
                    </span>
                  )}
                  {vehicle.alerts && vehicle.alerts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {vehicle.alerts.map((alert, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-xs text-red-600"
                        >
                          <ExclamationIcon className="size-3" /> {alert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <div>
                  ITV: {formatDate(vehicle.itvDate)}
                </div>
                <div>
                  Ins: {formatDate(vehicle.insuranceDate)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end gap-2">
                <CustomButton
                  type="button"
                  variant="transparent"
                  onClick={() => onMaintenance(vehicle)}
                  Icon={<ClipboardIcon className="size-4" />}
                  className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 hover:scale-105 !px-2 !py-1"
                  title="Maintenance"
                />
                <CustomButton
                  type="button"
                  variant="transparent"
                  onClick={() => onEdit(vehicle)}
                  Icon={<EditIcon className="size-4" />}
                  className="text-black hover:text-black hover:bg-gray-50 hover:scale-105 !px-2 !py-1"
                  title="Edit"
                />
                <CustomButton
                  type="button"
                  variant="transparent"
                  onClick={() => onDelete(vehicle.id)}
                  Icon={<DeleteIcon className="size-4" />}
                  className="text-red-600 hover:text-red-900 hover:bg-red-50 hover:scale-105 !px-2 !py-1"
                  title="Delete"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};