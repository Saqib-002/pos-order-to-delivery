import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DeliveryPerson } from "@/types/order";
import { User, Check, Bike, Car, X, Zap } from "lucide-react";

export const DeliveryPersonInput: React.FC<{
  deliveryPerson: DeliveryPerson | null;
  setDeliveryPerson: React.Dispatch<
    React.SetStateAction<DeliveryPerson | null>
  >;
  deliveryPersons: DeliveryPerson[];
  showSuggestions?: boolean;
  setShowSuggestions?: React.Dispatch<React.SetStateAction<boolean>>;
  onAssign?: () => void;
  disabled?: boolean;
  activeDeliveryCounts?: Record<string, number>;
}> = ({
  deliveryPerson,
  setDeliveryPerson,
  deliveryPersons,
  onAssign,
  disabled = false,
  activeDeliveryCounts = {},
}) => {
  const { t } = useTranslation();

  const activeDeliveryPersons = useMemo(
    () => deliveryPersons.filter((person) => person.isActive !== false),
    [deliveryPersons]
  );

  const handleTogglePerson = (person: DeliveryPerson) => {
    const isSelected =
      (deliveryPerson?.id && person.id && deliveryPerson.id === person.id) ||
      deliveryPerson?.name === person.name;

    if (isSelected) {
      setDeliveryPerson(null);
    } else {
      setDeliveryPerson(person);
    }
  };

  const getVehicleIcon = (vehicleType?: string) => {
    const type = (vehicleType || "").toLowerCase();
    if (type.includes("moto") || type.includes("bike") || type.includes("bici")) {
      return <Bike className="size-4 shrink-0" />;
    }
    if (type.includes("coche") || type.includes("car") || type.includes("auto")) {
      return <Car className="size-4 shrink-0" />;
    }
    return <User className="size-4 shrink-0" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
      {/* Top Header / Status Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-zinc-100 text-zinc-800 rounded-lg">
              <User className="size-4" />
            </span>
            <h3 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
              {t("deliveryPersonInput.selectDeliveryPerson") || "Repartidores"}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {deliveryPerson
              ? t("deliveryPersonInput.clickToAssign") ||
                "Haz clic en \"Asignar\" en cualquier pedido de abajo para despacharlo con este repartidor."
              : t("deliveryPersonInput.selectPrompt") ||
                "Selecciona un repartidor para asignarle pedidos."}
          </p>
        </div>

        {/* Quick Assign Action if someone is selected */}
        {onAssign && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {deliveryPerson && (
              <button
                type="button"
                onClick={() => setDeliveryPerson(null)}
                className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 border border-gray-200 cursor-pointer"
                title={t("deliveryPersonInput.clearSelection") || "Deseleccionar"}
              >
                <X className="size-3.5" />
                <span>{t("deliveryPersonInput.clearSelection") || "Limpiar"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAssign}
              disabled={disabled || !deliveryPerson}
              className="px-4 py-2 bg-black hover:bg-zinc-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-xs rounded-lg transition-all duration-150 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="size-3.5 fill-current" />
              <span>{t("deliveryPersonInput.quickAssign") || "Asignar Primer Pedido"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Buttons Grid */}
      <div className="mt-4">
        {activeDeliveryPersons.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            {t("deliveryPersonInput.noDeliveryPersons") ||
              "No hay repartidores disponibles. Puedes agregarlos en Configuración > Repartidores."}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {activeDeliveryPersons.map((person) => {
              const isSelected =
                (deliveryPerson?.id && person.id && deliveryPerson.id === person.id) ||
                deliveryPerson?.name === person.name;

              const driverKey = person.id || person.name;
              const activeCount = activeDeliveryCounts[driverKey] || 0;

              return (
                <button
                  key={person.id || person.name}
                  type="button"
                  onClick={() => handleTogglePerson(person)}
                  className={`group relative min-h-[46px] px-4 py-2.5 rounded-xl font-medium transition-all duration-150 flex items-center gap-3 cursor-pointer select-none text-left shadow-sm ${
                    isSelected
                      ? "bg-zinc-950 text-white ring-2 ring-zinc-950 ring-offset-2 shadow-md scale-[1.02]"
                      : "bg-white hover:bg-zinc-50 border border-gray-200 hover:border-gray-300 text-zinc-900"
                  }`}
                >
                  {/* Avatar / Vehicle Icon Indicator */}
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-zinc-800 text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200"
                    }`}
                  >
                    {isSelected ? (
                      <Check className="size-4 stroke-[3]" />
                    ) : (
                      getVehicleIcon(person.vehicleType)
                    )}
                  </div>

                  {/* Name and Info */}
                  <div className="flex flex-col min-w-0 pr-1">
                    <span
                      className={`text-sm font-bold truncate tracking-tight leading-tight ${
                        isSelected ? "text-white" : "text-zinc-900"
                      }`}
                    >
                      {person.name}
                    </span>
                    <span
                      className={`text-[11px] truncate leading-tight mt-0.5 ${
                        isSelected ? "text-zinc-300" : "text-zinc-500"
                      }`}
                    >
                      {person.vehicleType || "Repartidor"}
                    </span>
                  </div>

                  {/* Active Orders Badge (if any orders currently out for delivery) */}
                  {activeCount > 0 && (
                    <span
                      className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected
                          ? "bg-emerald-500 text-black"
                          : "bg-amber-100 text-amber-900 border border-amber-200"
                      }`}
                      title={`${activeCount} pedido(s) en curso`}
                    >
                      {activeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Indicator Banner */}
      {deliveryPerson && (
        <div className="mt-4 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs text-zinc-700 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {t("deliveryPersonInput.activeSelection") || "Repartidor seleccionado:"}{" "}
              <strong className="text-zinc-950 font-bold text-sm">
                {deliveryPerson.name}
              </strong>
              {deliveryPerson.vehicleType && (
                <span className="text-zinc-500 ml-1">
                  ({deliveryPerson.vehicleType})
                </span>
              )}
            </span>
          </div>
          <span className="hidden md:inline-block text-[11px] text-zinc-500 font-medium">
            {t("deliveryPersonInput.readyToAssignHint") ||
              "Listo: pulsa el botón \"Asignar\" en la fila del pedido deseado"}
          </span>
        </div>
      )}
    </div>
  );
};
