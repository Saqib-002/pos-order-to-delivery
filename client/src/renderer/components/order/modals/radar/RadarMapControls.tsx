import React from "react";
import { useTranslation } from "react-i18next";
import { Crosshair, Route } from "lucide-react";
import type { CustomRadarGroup } from "./radarTypes";

interface RadarMapControlsProps {
  showReadyOrders: boolean;
  setShowReadyOrders: (v: boolean) => void;
  showKitchenOrders: boolean;
  setShowKitchenOrders: (v: boolean) => void;
  showZones: boolean;
  setShowZones: (v: boolean) => void;
  readyOrdersCount: number;
  kitchenOrdersCount: number;
  deliveryZonesCount: number;
  onRecenter: () => void;
  routeInfo: { distanceKm: number; durationMin: number; stops: number } | null;
  radarMode: "auto" | "custom";
  selectedCustomGroup: CustomRadarGroup | null;
}

export const RadarMapControls: React.FC<RadarMapControlsProps> = ({
  showReadyOrders,
  setShowReadyOrders,
  showKitchenOrders,
  setShowKitchenOrders,
  showZones,
  setShowZones,
  readyOrdersCount,
  kitchenOrdersCount,
  deliveryZonesCount,
  onRecenter,
  routeInfo,
  radarMode,
  selectedCustomGroup,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Top-Right Controls: Touch-friendly Recenter Button */}
      <div className="absolute top-4 right-4 z-[1100]">
        <button
          onClick={onRecenter}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white/95 hover:bg-white text-zinc-800 rounded-xl shadow-lg border border-zinc-200 text-xs font-bold transition-all cursor-pointer backdrop-blur-md hover:shadow-xl active:scale-95 select-none"
          title={t("deliveryView.radar.recenterMap")}
        >
          <Crosshair className="size-4 text-red-600" />
          <span>{t("deliveryView.radar.recenter")}</span>
        </button>
      </div>

      {/* Map Floating Legend & Controls on Top-Left */}
      <div className="absolute top-4 left-4 z-[1100] flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-zinc-200 text-xs space-y-2 select-none min-w-[220px]">
          <div className="font-bold text-zinc-500 uppercase tracking-wider text-[11px] px-1 pb-1 border-b border-zinc-100">
            {t("deliveryView.radar.visibilityFilters")}
          </div>

          <label className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-zinc-100/80 active:bg-zinc-200 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={showReadyOrders}
              onChange={(e) => setShowReadyOrders(e.target.checked)}
              className="size-5 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer border-zinc-300"
            />
            <span className="size-3 rounded-full bg-emerald-600 shrink-0"></span>
            <span className="text-zinc-800 font-bold text-xs sm:text-sm">
              {t("deliveryView.radar.showReady", {
                count: readyOrdersCount,
              })}
            </span>
          </label>

          <label className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-zinc-100/80 active:bg-zinc-200 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={showKitchenOrders}
              onChange={(e) => setShowKitchenOrders(e.target.checked)}
              className="size-5 rounded-md text-amber-600 focus:ring-amber-500 cursor-pointer border-zinc-300"
            />
            <span className="size-3 rounded-full bg-amber-500 shrink-0"></span>
            <span className="text-zinc-800 font-bold text-xs sm:text-sm">
              {t("deliveryView.radar.showKitchen", {
                count: kitchenOrdersCount,
              })}
            </span>
          </label>

          {deliveryZonesCount > 0 && (
            <label className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-zinc-100/80 active:bg-zinc-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={showZones}
                onChange={(e) => setShowZones(e.target.checked)}
                className="size-5 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer border-zinc-300"
              />
              <span className="size-3 rounded-sm bg-emerald-500 border border-emerald-700 shrink-0"></span>
              <span className="text-zinc-800 font-bold text-xs sm:text-sm">
                {t("deliveryView.radar.showZones", {
                  count: deliveryZonesCount,
                })}
              </span>
            </label>
          )}
        </div>

        {routeInfo && (
          <div
            className="bg-zinc-950 text-white p-3.5 rounded-xl shadow-2xl border text-xs animate-in slide-in-from-top-2"
            style={{
              borderColor:
                radarMode === "custom" && selectedCustomGroup
                  ? selectedCustomGroup.color
                  : "#27272a",
            }}
          >
            <div className="font-bold flex items-center justify-between uppercase tracking-wider text-[10px] text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Route className="size-3.5 text-white" />
                {radarMode === "custom" && selectedCustomGroup
                  ? selectedCustomGroup.name
                  : t("deliveryView.radar.multiStopRoute")}
              </span>
              {radarMode === "custom" && selectedCustomGroup && (
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: selectedCustomGroup.color }}
                />
              )}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {t("deliveryView.radar.deliveriesDistance", {
                count: routeInfo.stops,
                dist: routeInfo.distanceKm,
              })}
            </div>
            <div className="text-zinc-400 text-[11px] mt-0.5">
              {t("deliveryView.radar.estimatedDriveTime", {
                min: routeInfo.durationMin,
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
