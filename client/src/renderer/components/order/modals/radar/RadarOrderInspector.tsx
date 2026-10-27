import React from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Phone,
  Clock,
  ArrowRightLeft,
  Plus,
  X,
  AlertTriangle,
  Crosshair,
  RefreshCw,
  Check,
} from "lucide-react";
import { GeocodedDeliveryOrder } from "@/renderer/utils/googleMaps";
import { formatAddress, getOrderDisplayNumber } from "@/renderer/utils/utils";
import {
  type CustomRadarGroup,
  getOrderElapsedTime,
  ENABLE_MANUAL_LOCATION_FIXES,
} from "./radarTypes";
import { RadarGroupDayBadge } from "./RadarGroupDayBadge";

interface RadarOrderInspectorProps {
  inspectedOrder: GeocodedDeliveryOrder | null;
  onClose: () => void;
  orderPrefix?: string;
  radarMode: "auto" | "custom";
  selectedOrderIds: string[];
  onToggleOrderSelection: (orderId: string) => void;
  customGroups: CustomRadarGroup[];
  selectedCustomGroup: CustomRadarGroup | null;
  onRemoveOrderFromGroup: (groupId: string, orderId: string) => void;
  onAddOrdersToGroup: (groupId: string, orderIds: string[]) => void;
  onStartMoveOrder: (orderId: string, currentGroupId: string) => void;
  // Location correction (shared by every POS)
  onFixLocation: (addressKey: string, label: string) => void;
  onLookUpAgain: (addressKey: string) => void;
  // Flagged pin is actually right: store it as a confirmed (manual) location
  onConfirmLocation: (addressKey: string, lat: number, lng: number) => void;
}

export const RadarOrderInspector: React.FC<RadarOrderInspectorProps> = ({
  inspectedOrder,
  onClose,
  orderPrefix = "K",
  radarMode,
  selectedOrderIds,
  onToggleOrderSelection,
  customGroups,
  selectedCustomGroup,
  onRemoveOrderFromGroup,
  onAddOrdersToGroup,
  onStartMoveOrder,
  onFixLocation,
  onLookUpAgain,
  onConfirmLocation,
}) => {
  const { t } = useTranslation();

  if (!inspectedOrder) return null;

  const isReady =
    inspectedOrder.order.status?.toLowerCase() === "ready for delivery";
  const warnings = inspectedOrder.locationWarnings || [];
  const addressKey = inspectedOrder.addressKey;
  const displayNum = getOrderDisplayNumber(inspectedOrder.order, orderPrefix);

  return (
    <div className="absolute bottom-4 left-4 z-[1100] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-zinc-300 max-w-sm text-xs animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
              isReady
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {isReady
              ? t("deliveryView.radar.statusReady")
              : t("deliveryView.radar.statusKitchen")}
          </span>
          <h4 className="text-sm font-bold text-zinc-900 mt-1">
            {t("deliveryView.radar.orderTitle", {
              displayNum: getOrderDisplayNumber(
                inspectedOrder.order,
                orderPrefix
              ),
            })}
          </h4>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-2 space-y-1.5 text-zinc-600">
        <div className="flex items-center gap-1.5 text-zinc-900 font-medium">
          <MapPin className="size-3.5 text-red-500 shrink-0" />
          <span className="truncate">
            {inspectedOrder.order.customer?.address
              ? formatAddress(inspectedOrder.order.customer.address)
              : t("deliveryView.radar.noAddress")}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span>
            {t("deliveryView.radar.client", {
              name: inspectedOrder.order.customer?.name || "-",
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="size-3 text-zinc-400" />
            {inspectedOrder.order.customer?.phone || "-"}
          </span>
        </div>
        <div className="flex items-center justify-between bg-zinc-100 p-2.5 rounded-lg border border-zinc-200 mt-1">
          <div>
            <span className="text-zinc-500">
              {t("deliveryView.radar.bearing")}{" "}
            </span>
            <strong className="text-zinc-900">
              {t(`deliveryView.radar.directions.${inspectedOrder.compassCode}`)}{" "}
              ({inspectedOrder.bearing}°)
            </strong>
          </div>
          <div>
            <span className="text-zinc-500">
              {t("deliveryView.radar.distance")}{" "}
            </span>
            <strong className="text-zinc-900">
              {inspectedOrder.distanceFromRestaurantKm} km
            </strong>
          </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200 mt-1.5">
          <span className="text-zinc-600 flex items-center gap-1 font-medium">
            <Clock className="size-3 text-zinc-500" />
            {isReady
              ? t("deliveryView.radar.elapsedReady")
              : t("deliveryView.radar.elapsedKitchen")}
          </span>
          <span className="font-bold text-zinc-900">
            {getOrderElapsedTime(inspectedOrder.order).text}
            <span className="text-zinc-400 font-normal ml-1">
              ({getOrderElapsedTime(inspectedOrder.order).timeStr})
            </span>
          </span>
        </div>

        {/* Location checks: why this pin may be in the wrong place */}
        {warnings.length > 0 && (
          <div className="mt-1.5 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 space-y-1">
            {warnings.map((w) => (
              <div key={w} className="flex items-start gap-1.5 text-[11px] font-semibold">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                <span>{t(`deliveryView.radar.locationWarning.${w}`)}</span>
              </div>
            ))}
            {ENABLE_MANUAL_LOCATION_FIXES && addressKey && (
              <button
                type="button"
                onClick={() =>
                  onConfirmLocation(
                    addressKey,
                    inspectedOrder.location.lat,
                    inspectedOrder.location.lng
                  )
                }
                className="w-full mt-1 min-h-8 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer touch-manipulation"
              >
                <Check className="size-3.5" />
                {t("deliveryView.radar.confirmLocation")}
              </button>
            )}
          </div>
        )}
        {inspectedOrder.locationSource === "manual" && (
          <div className="mt-1.5 text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {t("deliveryView.radar.manualLocation")}
          </div>
        )}

        {ENABLE_MANUAL_LOCATION_FIXES && addressKey && (
          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => onFixLocation(addressKey, displayNum)}
              className="min-h-8 px-2 rounded-lg border border-zinc-300 bg-white text-[11px] font-bold text-zinc-800 active:bg-zinc-100 flex items-center justify-center gap-1 cursor-pointer touch-manipulation"
            >
              <Crosshair className="size-3.5" />
              {t("deliveryView.radar.fixLocation")}
            </button>
            <button
              type="button"
              onClick={() => onLookUpAgain(addressKey)}
              className="min-h-8 px-2 rounded-lg border border-zinc-300 bg-white text-[11px] font-bold text-zinc-800 active:bg-zinc-100 flex items-center justify-center gap-1 cursor-pointer touch-manipulation"
            >
              <RefreshCw className="size-3.5" />
              {t("deliveryView.radar.lookUpAgain")}
            </button>
          </div>
        )}
      </div>

      {/* Actions on Inspected Order */}
      {radarMode === "auto" ? (
        isReady && (
          <button
            onClick={() => onToggleOrderSelection(inspectedOrder.order.id)}
            className={`w-full mt-3 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedOrderIds.includes(inspectedOrder.order.id)
                ? "bg-zinc-100 hover:bg-zinc-200 text-red-600 border border-zinc-300"
                : "bg-black hover:bg-zinc-800 text-white shadow-md"
            }`}
          >
            {selectedOrderIds.includes(inspectedOrder.order.id)
              ? t("deliveryView.radar.removeFromRoute")
              : t("deliveryView.radar.addToRoute")}
          </button>
        )
      ) : (
        (() => {
          const group = customGroups.find((g) =>
            g.orderIds.includes(inspectedOrder.order.id)
          );

          if (group) {
            return (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 border border-zinc-200 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-zinc-800">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    {group.name}
                    <RadarGroupDayBadge createdAt={group.createdAt} />
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveOrderFromGroup(group.id, inspectedOrder.order.id)
                    }
                    className="text-red-600 hover:text-red-700 font-bold cursor-pointer"
                  >
                    {t("deliveryView.radar.removeFromGroup", "Quitar")}
                  </button>
                </div>
                {customGroups.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      onStartMoveOrder(inspectedOrder.order.id, group.id)
                    }
                    className="w-full py-1.5 px-3 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRightLeft className="size-3" />
                    <span>
                      {t("deliveryView.radar.moveToGroup", "Mover a otro grupo")}
                    </span>
                  </button>
                )}
              </div>
            );
          }

          // Order is unassigned in Custom mode
          if (selectedCustomGroup) {
            return (
              <button
                type="button"
                onClick={() =>
                  onAddOrdersToGroup(selectedCustomGroup.id, [
                    inspectedOrder.order.id,
                  ])
                }
                className="w-full mt-3 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-white shadow-md hover:opacity-95"
                style={{ backgroundColor: selectedCustomGroup.color }}
              >
                <Plus className="size-4" />
                <span>
                  {t("deliveryView.radar.addToGroup", "Agregar a")}{" "}
                  {selectedCustomGroup.name}
                </span>
              </button>
            );
          }
          return null;
        })()
      )}
    </div>
  );
};
