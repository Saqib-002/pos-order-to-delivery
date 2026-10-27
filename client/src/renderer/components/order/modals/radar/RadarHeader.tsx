import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Compass,
  ChefHat,
  RefreshCw,
  X,
  MapPinOff,
  AlertTriangle,
  Crosshair,
} from "lucide-react";
import type { GeocodedDeliveryOrder } from "@/renderer/utils/googleMaps";
import { getOrderDisplayNumber } from "@/renderer/utils/utils";
import {
  type UnlocatedRadarOrder,
  ENABLE_MANUAL_LOCATION_FIXES,
} from "./radarTypes";

interface RadarHeaderProps {
  readyOrdersCount: number;
  kitchenOrdersCount: number;
  isGeocoding: boolean;
  geocodeProgress: { done: number; total: number } | null;
  unlocatedOrders: UnlocatedRadarOrder[];
  // Orders on the map whose location looks suspicious
  warnedOrders: GeocodedDeliveryOrder[];
  onInspectOrder: (item: GeocodedDeliveryOrder) => void;
  onPlaceOnMap: (addressKey: string, label: string) => void;
  orderPrefix?: string;
  onRefresh: () => void;
  onClose: () => void;
}

export const RadarHeader: React.FC<RadarHeaderProps> = ({
  readyOrdersCount,
  kitchenOrdersCount,
  isGeocoding,
  geocodeProgress,
  unlocatedOrders,
  warnedOrders,
  onInspectOrder,
  onPlaceOnMap,
  orderPrefix = "K",
  onRefresh,
  onClose,
}) => {
  const { t } = useTranslation();
  const [showUnlocated, setShowUnlocated] = useState(false);

  return (
    <div className="relative px-6 py-4 border-b border-zinc-200 bg-zinc-900 text-white flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white shadow-md">
          <Compass className="size-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t("deliveryView.radar.title")}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700">
              {t("deliveryView.radar.badgeAngle")}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t("deliveryView.radar.subtitle")}
          </p>
        </div>
      </div>

      {/* Quick Stats & Controls */}
      <div className="flex items-center gap-4">
        {/* Progress of online address lookups (only new addresses need one) */}
        {geocodeProgress && (
          <span className="text-xs font-semibold text-zinc-300 inline-flex items-center gap-1.5">
            <RefreshCw className="size-3.5 animate-spin" />
            {t("deliveryView.radar.locatingProgress", {
              done: geocodeProgress.done,
              total: geocodeProgress.total,
            })}
          </span>
        )}

        {warnedOrders.length > 0 && (
          <button
            type="button"
            onClick={() => setShowUnlocated((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 cursor-pointer"
          >
            <AlertTriangle className="size-3.5" />
            {t("deliveryView.radar.warnedCount", {
              count: warnedOrders.length,
            })}
          </button>
        )}

        {unlocatedOrders.length > 0 && (
          <button
            type="button"
            onClick={() => setShowUnlocated((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25 cursor-pointer"
          >
            <MapPinOff className="size-3.5" />
            {t("deliveryView.radar.unlocatedCount", {
              count: unlocatedOrders.length,
            })}
          </button>
        )}

        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs shadow-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
            {t("deliveryView.radar.readyOrdersBadge", {
              count: readyOrdersCount,
            })}
          </span>
          <span className="text-zinc-600">|</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
            <ChefHat className="size-3.5 text-amber-400" />
            {t("deliveryView.radar.kitchenOrdersBadge", {
              count: kitchenOrdersCount,
            })}
          </span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isGeocoding}
          className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700 shadow-sm cursor-pointer disabled:opacity-50"
          title={t("deliveryView.radar.refreshLocations")}
        >
          <RefreshCw
            className={`size-4 ${isGeocoding ? "animate-spin" : ""}`}
          />
        </button>

        <button
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Orders that couldn't be placed on the map, with the reason */}
      {showUnlocated &&
        (unlocatedOrders.length > 0 || warnedOrders.length > 0) && (
        <div className="absolute right-6 top-full mt-2 z-[1200] w-[420px] max-h-[60vh] overflow-y-auto bg-white text-zinc-900 rounded-xl shadow-2xl border border-zinc-200">
          <div className="sticky top-0 bg-white px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">
                {t("deliveryView.radar.unlocatedTitle")}
              </div>
              <div className="text-[11px] text-zinc-500">
                {ENABLE_MANUAL_LOCATION_FIXES
                  ? t("deliveryView.radar.unlocatedHint")
                  : t("deliveryView.radar.unlocatedHintSimple")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowUnlocated(false)}
              className="size-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 rounded-lg cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
          {unlocatedOrders.length > 0 && (
            <div className="px-4 py-2.5 border-b border-zinc-100 bg-red-50 text-sm font-bold text-red-800">
              {t("deliveryView.radar.notOnMapTitle")}
            </div>
          )}
          <div className="divide-y divide-zinc-100">
            {unlocatedOrders.map((u) => (
              <div key={u.order.id} className="px-4 py-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">
                    {getOrderDisplayNumber(u.order, orderPrefix)}
                    <span className="font-normal text-zinc-500 ml-1.5">
                      {u.order.customer?.name || "-"}
                    </span>
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                      u.reason === "lookup_failed"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {t(`deliveryView.radar.unlocatedReason.${u.reason}`)}
                  </span>
                </div>
                <div className="text-zinc-500 mt-0.5 break-words">
                  {u.address || "-"}
                </div>
                {ENABLE_MANUAL_LOCATION_FIXES && u.addressKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnlocated(false);
                      onPlaceOnMap(
                        u.addressKey!,
                        getOrderDisplayNumber(u.order, orderPrefix)
                      );
                    }}
                    className="mt-1.5 min-h-8 px-3 rounded-lg border border-zinc-300 text-[11px] font-bold text-zinc-800 active:bg-zinc-100 inline-flex items-center gap-1 cursor-pointer touch-manipulation"
                  >
                    <Crosshair className="size-3.5" />
                    {t("deliveryView.radar.placeOnMap")}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* On the map, but the location may be wrong */}
          {warnedOrders.length > 0 && (
            <>
              <div className="px-4 py-2.5 border-t border-b border-zinc-100 bg-amber-50 text-sm font-bold text-amber-900">
                {t("deliveryView.radar.checkLocationTitle")}
              </div>
              <div className="divide-y divide-zinc-100">
                {warnedOrders.map((item) => (
                  <button
                    key={item.order.id}
                    type="button"
                    onClick={() => {
                      setShowUnlocated(false);
                      onInspectOrder(item);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-zinc-50 active:bg-zinc-100 cursor-pointer"
                  >
                    <div className="font-bold">
                      {getOrderDisplayNumber(item.order, orderPrefix)}
                      <span className="font-normal text-zinc-500 ml-1.5">
                        {item.order.customer?.name || "-"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(item.locationWarnings || []).map((w) => (
                        <span
                          key={w}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                        >
                          {t(`deliveryView.radar.locationWarning.${w}`)}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
