import React from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Navigation,
  Check,
  ChefHat,
  RefreshCw,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { Order, DeliveryPerson } from "@/types/order";
import {
  DeliveryCluster,
  GeocodedDeliveryOrder,
} from "@/renderer/utils/googleMaps";
import { formatAddress, getOrderDisplayNumber } from "@/renderer/utils/utils";
import { calculateOrderTotal } from "@/renderer/utils/orderCalculations";
import { CustomSelect } from "@/renderer/components/ui/CustomSelect";
import { getOrderElapsedTime } from "./radarTypes";
import { RadarElapsedBadge } from "./RadarElapsedBadge";

interface RadarAutoSidebarProps {
  clusters: DeliveryCluster[];
  activeClusterId: string | null;
  setActiveClusterId: (id: string | null) => void;
  selectedOrderIds: string[];
  selectedOrders: Order[];
  toggleOrderSelection: (orderId: string) => void;
  selectClusterOrders: (cluster: DeliveryCluster) => void;
  setInspectedOrder: (item: GeocodedDeliveryOrder) => void;
  deliveryPersons: DeliveryPerson[];
  selectedDriverId: string;
  setSelectedDriverId: (id: string) => void;
  handleBatchAssign: () => void;
  isAssigning: boolean;
  orderPrefix?: string;
}

export const RadarAutoSidebar: React.FC<RadarAutoSidebarProps> = ({
  clusters,
  activeClusterId,
  setActiveClusterId,
  selectedOrderIds,
  selectedOrders,
  toggleOrderSelection,
  selectClusterOrders,
  setInspectedOrder,
  deliveryPersons,
  selectedDriverId,
  setSelectedDriverId,
  handleBatchAssign,
  isAssigning,
  orderPrefix = "K",
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Auto Clusters Header Subtitle */}
      <div className="p-3.5 border-b border-zinc-200 bg-zinc-50">
        <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="size-3.5 text-zinc-700" />
          <span>{t("deliveryView.radar.corridorSuggestions")}</span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {t("deliveryView.radar.corridorDescription")}
        </p>
      </div>

      {/* Corridor Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {clusters.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <Compass className="size-10 mx-auto stroke-1 mb-2 text-zinc-300" />
            <p className="text-sm font-medium">
              {t("deliveryView.radar.noActiveOrders")}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {t("deliveryView.radar.noActiveOrdersSub")}
            </p>
          </div>
        ) : (
          clusters.map((cluster) => {
            const isHovered = activeClusterId === cluster.id;
            const allReadySelected =
              cluster.readyCount > 0 &&
              cluster.orders
                .filter(
                  (o) =>
                    o.order.status?.toLowerCase() === "ready for delivery"
                )
                .every((o) => selectedOrderIds.includes(o.order.id));

            const translatedDir = t(
              `deliveryView.radar.directions.${cluster.compassCode}`
            );
            const clusterTitle = t("deliveryView.radar.heading", {
              dir: translatedDir,
              deg: Math.round(cluster.averageBearing),
            });

            return (
              <div
                key={cluster.id}
                onMouseEnter={() => setActiveClusterId(cluster.id)}
                onMouseLeave={() => setActiveClusterId(null)}
                className={`p-3.5 rounded-xl border transition-all ${
                  isHovered
                    ? "border-zinc-800 bg-zinc-50 shadow-md"
                    : "border-zinc-200 bg-white hover:border-zinc-300 shadow-sm"
                }`}
              >
                {/* Cluster Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900">
                      <Navigation className="size-3.5 text-zinc-900 rotate-45" />
                      {clusterTitle}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {t("deliveryView.radar.corridorStats", {
                        count: cluster.orders.length,
                        dist: cluster.maxDistanceBetweenKm,
                      })}
                    </div>
                  </div>

                  {cluster.readyCount > 0 && (
                    <button
                      onClick={() => selectClusterOrders(cluster)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        allReadySelected
                          ? "bg-zinc-100 text-zinc-900 border border-zinc-300"
                          : "bg-black text-white hover:bg-zinc-800 shadow-sm"
                      }`}
                    >
                      {allReadySelected ? (
                        <>
                          <Check className="size-3 text-emerald-600" />
                          {t("deliveryView.radar.selected")}
                        </>
                      ) : (
                        t("deliveryView.radar.groupReady")
                      )}
                    </button>
                  )}
                </div>

                {/* Orders in this cluster */}
                <div className="mt-3 space-y-1.5">
                  {cluster.orders.map((item) => {
                    const isReady =
                      item.order.status?.toLowerCase() ===
                      "ready for delivery";
                    const isSelected = selectedOrderIds.includes(
                      item.order.id
                    );
                    const total = calculateOrderTotal(
                      item.order.items || []
                    ).orderTotal;

                    return (
                      <div
                        key={item.order.id}
                        onClick={() => {
                          setInspectedOrder(item);
                          if (isReady) {
                            toggleOrderSelection(item.order.id);
                          }
                        }}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "border-black bg-zinc-100 font-semibold text-black shadow-sm"
                            : isReady
                            ? "border-emerald-200/60 bg-emerald-50/40 hover:bg-emerald-50"
                            : "border-amber-200/60 bg-amber-50/40 hover:bg-amber-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isReady}
                            onChange={() => {}}
                            className="size-5 rounded-md text-black focus:ring-black disabled:opacity-30 cursor-pointer shrink-0"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-zinc-900">
                                {getOrderDisplayNumber(
                                  item.order,
                                  orderPrefix
                                )}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-1 ${
                                  isReady
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {!isReady && (
                                  <ChefHat className="size-3 text-amber-600" />
                                )}
                                {isReady
                                  ? t("deliveryView.radar.statusTagReady")
                                  : t("deliveryView.radar.statusTagKitchen")}
                              </span>
                            </div>
                            <div className="text-zinc-500 truncate text-[11px] mt-0.5">
                              {item.order.customer?.address
                                ? formatAddress(item.order.customer.address)
                                : "-"}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <RadarElapsedBadge order={item.order} />
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-zinc-900">
                            €{total.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {item.distanceFromRestaurantKm} km
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hint if there's a cooking order on the same path */}
                {cluster.kitchenCount > 0 && cluster.readyCount > 0 && (() => {
                  const kitchenOrdersList = cluster.orders
                    .filter(
                      (o) =>
                        o.order.status?.toLowerCase() === "sent to kitchen"
                    )
                    .map((o) => getOrderElapsedTime(o.order))
                    .sort((a, b) => b.minutes - a.minutes);
                  const longestKitchenTime = kitchenOrdersList[0]?.text;

                  return (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-1.5 shadow-sm">
                      <ChefHat className="size-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        {longestKitchenTime
                          ? t("deliveryView.radar.kitchenAlertWithTime", {
                              count: cluster.kitchenCount,
                              time: longestKitchenTime,
                            })
                          : t("deliveryView.radar.kitchenAlert", {
                              count: cluster.kitchenCount,
                            })}
                      </span>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Dispatch / Assignment Bar */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
            {t("deliveryView.radar.dispatchHeader")}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-black text-white font-bold">
            {t("deliveryView.radar.selectedCount", {
              count: selectedOrders.length,
            })}
          </span>
        </div>

        {/* Delivery Person Dropdown */}
        <div>
          <CustomSelect
            options={deliveryPersons
              .filter((p) => p.isActive !== false)
              .map((p) => ({
                value: p.id || p.name,
                label: `${p.name} (${p.vehicleType || "Vehículo"})`,
              }))}
            value={selectedDriverId}
            onChange={(val) => setSelectedDriverId(val)}
            placeholder={t("deliveryView.radar.selectDriverPlaceholder")}
            className="w-full"
            portalClassName="delivery-radar-driver-portal"
          />
        </div>

        {/* Dispatch Button */}
        <button
          onClick={handleBatchAssign}
          disabled={
            isAssigning ||
            selectedOrders.length === 0 ||
            !selectedDriverId
          }
          className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.01] cursor-pointer"
        >
          {isAssigning ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              {t("deliveryView.radar.assigning")}
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              {t("deliveryView.radar.assignButton", {
                count: selectedOrders.length,
              })}
            </>
          )}
        </button>
      </div>
    </>
  );
};
