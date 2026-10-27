import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Layers,
  Plus,
  FolderPlus,
  Edit2,
  Check,
  X,
  Trash2,
  ChefHat,
  CheckCircle2,
  ArrowRightLeft,
  RefreshCw,
} from "lucide-react";
import { DeliveryPerson } from "@/types/order";
import { GeocodedDeliveryOrder } from "@/renderer/utils/googleMaps";
import { formatAddress, getOrderDisplayNumber } from "@/renderer/utils/utils";
import { calculateOrderTotal } from "@/renderer/utils/orderCalculations";
import { CustomSelect } from "@/renderer/components/ui/CustomSelect";
import { type CustomRadarGroup, CUSTOM_GROUP_PALETTE } from "./radarTypes";
import { RadarElapsedBadge } from "./RadarElapsedBadge";
import { RadarGroupDayBadge } from "./RadarGroupDayBadge";

interface RadarCustomSidebarProps {
  customGroups: CustomRadarGroup[];
  selectedCustomGroupId: string | null;
  setSelectedCustomGroupId: (id: string | null) => void;
  selectedCustomGroup: CustomRadarGroup | null;
  geocodedOrders: GeocodedDeliveryOrder[];
  unassignedGeocodedOrders: GeocodedDeliveryOrder[];
  checkedUnassignedOrderIds: string[];
  setCheckedUnassignedOrderIds: React.Dispatch<React.SetStateAction<string[]>>;
  editingGroupId: string | null;
  editingGroupName: string;
  setEditingGroupName: (name: string) => void;
  colorPickerGroupId: string | null;
  setColorPickerGroupId: (id: string | null) => void;
  onCreateGroup: () => void;
  onDeleteGroup: (groupId: string) => void;
  onStartRenameGroup: (group: CustomRadarGroup) => void;
  onSaveRenameGroup: (groupId: string) => void;
  onCancelRenameGroup: () => void;
  onChangeGroupColor: (groupId: string, newColor: string) => void;
  onAddOrdersToGroup: (groupId: string, orderIds: string[]) => void;
  onRemoveOrderFromGroup: (groupId: string, orderId: string) => void;
  onStartMoveOrder: (orderId: string, currentGroupId: string) => void;
  setInspectedOrder: (item: GeocodedDeliveryOrder) => void;
  deliveryPersons: DeliveryPerson[];
  customGroupDriverId: string;
  setCustomGroupDriverId: (id: string) => void;
  onDispatchCustomGroup: (group: CustomRadarGroup) => void;
  isAssigning: boolean;
  orderPrefix?: string;
}

export const RadarCustomSidebar: React.FC<RadarCustomSidebarProps> = ({
  customGroups,
  selectedCustomGroupId,
  setSelectedCustomGroupId,
  selectedCustomGroup,
  geocodedOrders,
  unassignedGeocodedOrders,
  checkedUnassignedOrderIds,
  setCheckedUnassignedOrderIds,
  editingGroupId,
  editingGroupName,
  setEditingGroupName,
  colorPickerGroupId,
  setColorPickerGroupId,
  onCreateGroup,
  onDeleteGroup,
  onStartRenameGroup,
  onSaveRenameGroup,
  onCancelRenameGroup,
  onChangeGroupColor,
  onAddOrdersToGroup,
  onRemoveOrderFromGroup,
  onStartMoveOrder,
  setInspectedOrder,
  deliveryPersons,
  customGroupDriverId,
  setCustomGroupDriverId,
  onDispatchCustomGroup,
  isAssigning,
  orderPrefix = "K",
}) => {
  const { t } = useTranslation();
  // Set on Escape/Cancel so the input's blur (fired as it unmounts) doesn't save
  const skipBlurSaveRef = useRef(false);
  // Two-step delete: first click arms the button, second click deletes
  const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<
    string | null
  >(null);

  // Close the color picker when clicking anywhere outside it
  useEffect(() => {
    if (!colorPickerGroupId) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest?.("[data-radar-color-picker]")) {
        setColorPickerGroupId(null);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [colorPickerGroupId, setColorPickerGroupId]);

  // Disarm a pending delete after a few seconds
  useEffect(() => {
    if (!pendingDeleteGroupId) return;
    const timeout = setTimeout(() => setPendingDeleteGroupId(null), 3000);
    return () => clearTimeout(timeout);
  }, [pendingDeleteGroupId]);

  return (
    <>
      {/* Custom Groups Header */}
      <div className="p-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
            <Layers className="size-4 text-zinc-700" />
            <span>
              {t("deliveryView.radar.customGroupsTitle", "Grupos de Reparto")}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 font-bold">
              {customGroups.length}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {t(
              "deliveryView.radar.customGroupsSub",
              "Organiza y asigna grupos a tu medida"
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCreateGroup()}
          className="flex items-center gap-1.5 px-3 min-h-9 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 touch-manipulation"
        >
          <Plus className="size-3.5" />
          <span>{t("deliveryView.radar.createGroup", "Nuevo Grupo")}</span>
        </button>
      </div>

      {/* Custom Groups Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {customGroups.length === 0 ? (
          <div className="text-center py-8 px-4 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
            <div className="p-3 bg-zinc-100 rounded-full w-fit mx-auto mb-2 text-zinc-400">
              <FolderPlus className="size-6" />
            </div>
            <p className="text-sm font-bold text-zinc-700">
              {t(
                "deliveryView.radar.noCustomGroups",
                "Aún no has creado ningún grupo"
              )}
            </p>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              {t(
                "deliveryView.radar.noCustomGroupsSub",
                "Crea un grupo para comenzar a organizar tus pedidos manualmente."
              )}
            </p>
            <button
              type="button"
              onClick={() => onCreateGroup()}
              className="mt-3 inline-flex items-center gap-1.5 px-4 min-h-9 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 touch-manipulation"
            >
              <Plus className="size-3.5" />
              <span>
                {t("deliveryView.radar.createGroup", "Crear Primer Grupo")}
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {customGroups.map((group) => {
              const isSelected = selectedCustomGroupId === group.id;
              const groupOrders = geocodedOrders.filter((g) =>
                group.orderIds.includes(g.order.id)
              );
              const readyOrders = groupOrders.filter(
                (g) => g.order.status?.toLowerCase() === "ready for delivery"
              );
              const kitchenOrders = groupOrders.filter(
                (g) => g.order.status?.toLowerCase() === "sent to kitchen"
              );
              const groupTotal = groupOrders.reduce(
                (sum, g) =>
                  sum + calculateOrderTotal(g.order.items || []).orderTotal,
                0
              );

              return (
                <div
                  key={group.id}
                  className={`rounded-xl border transition-all ${
                    isSelected
                      ? "shadow-md bg-zinc-50/50"
                      : "border-zinc-200 bg-white hover:border-zinc-300 shadow-sm"
                  }`}
                  style={{
                    borderColor: isSelected ? group.color : undefined,
                    borderWidth: isSelected ? "2px" : "1px",
                  }}
                >
                  {/* Group Card Header */}
                  <div
                    onClick={() => setSelectedCustomGroupId(group.id)}
                    className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none border-b border-zinc-100"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Color Swatch / Picker Trigger */}
                      <div className="relative" data-radar-color-picker>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setColorPickerGroupId(
                              colorPickerGroupId === group.id ? null : group.id
                            );
                          }}
                          className="size-8 flex items-center justify-center rounded-full cursor-pointer shrink-0 touch-manipulation active:scale-95"
                          title={t(
                            "deliveryView.radar.changeColor",
                            "Cambiar color"
                          )}
                        >
                          <span
                            className="size-5 rounded-full border-2 border-white shadow-sm ring-1 ring-zinc-300"
                            style={{ backgroundColor: group.color }}
                          />
                        </button>
                        {colorPickerGroupId === group.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-9 left-0 z-50 p-2 bg-white rounded-xl shadow-xl border border-zinc-200 grid grid-cols-5 gap-2 w-max animate-in fade-in zoom-in-95"
                          >
                            {CUSTOM_GROUP_PALETTE.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  onChangeGroupColor(group.id, c);
                                  setColorPickerGroupId(null);
                                }}
                                className={`size-7 rounded-full border-2 border-white cursor-pointer transition-transform active:scale-95 touch-manipulation ${
                                  group.color === c ? "scale-110 shadow-sm" : ""
                                }`}
                                style={{
                                  backgroundColor: c,
                                  boxShadow:
                                    group.color === c
                                      ? `0 0 0 2px #ffffff, 0 0 0 4px ${c}`
                                      : undefined,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Group Name / Rename Inline Input */}
                      {editingGroupId === group.id ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 flex-1"
                        >
                          <input
                            type="text"
                            value={editingGroupName}
                            onChange={(e) =>
                              setEditingGroupName(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                onSaveRenameGroup(group.id);
                              if (e.key === "Escape") {
                                skipBlurSaveRef.current = true;
                                onCancelRenameGroup();
                              }
                            }}
                            onFocus={() => {
                              skipBlurSaveRef.current = false;
                            }}
                            onBlur={() => {
                              if (skipBlurSaveRef.current) return;
                              onSaveRenameGroup(group.id);
                            }}
                            autoFocus
                            className="text-xs font-bold px-2 h-8 min-w-0 border border-zinc-300 rounded-lg flex-1 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                          {/* preventDefault on mousedown keeps the input focused, so onBlur doesn't save before Cancel */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => onSaveRenameGroup(group.id)}
                            className="size-8 shrink-0 flex items-center justify-center text-emerald-700 bg-emerald-50 border border-emerald-200 active:bg-emerald-100 rounded-lg cursor-pointer touch-manipulation"
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              skipBlurSaveRef.current = true;
                              onCancelRenameGroup();
                            }}
                            className="size-8 shrink-0 flex items-center justify-center text-zinc-500 bg-white border border-zinc-200 active:bg-zinc-100 rounded-lg cursor-pointer touch-manipulation"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="font-bold text-sm text-zinc-900 truncate">
                            {group.name}
                          </span>
                          <RadarGroupDayBadge createdAt={group.createdAt} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartRenameGroup(group);
                            }}
                            className="size-8 shrink-0 flex items-center justify-center text-zinc-500 border border-zinc-200 bg-white active:bg-zinc-100 rounded-lg transition-colors cursor-pointer touch-manipulation"
                            title={t(
                              "deliveryView.radar.renameGroup",
                              "Renombrar"
                            )}
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          {isSelected && (
                            <span
                              className="text-[10px] px-1.5 py-0.2 rounded font-bold text-white uppercase tracking-wider"
                              style={{ backgroundColor: group.color }}
                            >
                              {t(
                                "deliveryView.radar.activeGroupBadge",
                                "Activo"
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Badges & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-bold text-zinc-900">
                        €{groupTotal.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Empty groups delete immediately; groups with orders need a second click
                          if (
                            group.orderIds.length === 0 ||
                            pendingDeleteGroupId === group.id
                          ) {
                            setPendingDeleteGroupId(null);
                            onDeleteGroup(group.id);
                          } else {
                            setPendingDeleteGroupId(group.id);
                          }
                        }}
                        className={`h-8 min-w-8 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 border touch-manipulation ${
                          pendingDeleteGroupId === group.id
                            ? "text-white bg-red-600 border-red-600 active:bg-red-700 text-xs font-bold px-3"
                            : "text-red-600 bg-white border-zinc-200 active:bg-red-50"
                        }`}
                        title={t(
                          "deliveryView.radar.deleteGroup",
                          "Eliminar Grupo"
                        )}
                      >
                        <Trash2 className="size-3.5" />
                        {pendingDeleteGroupId === group.id && (
                          <span>
                            {t(
                              "deliveryView.radar.confirmDeleteGroup",
                              "¿Eliminar?"
                            )}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Group Orders List */}
                  <div className="p-3 space-y-2">
                    {/* Quick Stats Badges */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {readyOrders.length}{" "}
                          {t("deliveryView.radar.statusTagReady", "Listos")}
                        </span>
                        {kitchenOrders.length > 0 && (
                          <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-flex items-center gap-1">
                            <ChefHat className="size-3" />
                            {kitchenOrders.length}{" "}
                            {t(
                              "deliveryView.radar.statusTagKitchen",
                              "Cocina"
                            )}
                          </span>
                        )}
                      </div>
                      <span>
                        {groupOrders.length}{" "}
                        {t("deliveryView.radar.ordersCount", "pedidos")}
                        {group.orderIds.length > groupOrders.length && (
                          <span className="text-zinc-400 text-[10px] ml-1">
                            ({group.orderIds.length - groupOrders.length}{" "}
                            {t(
                              "deliveryView.radar.otherDateOrFilter",
                              "en otra fecha/filtro"
                            )}
                            )
                          </span>
                        )}
                      </span>
                    </div>

                    {groupOrders.length === 0 ? (
                      <div className="text-center py-3 text-xs text-zinc-400 bg-white rounded-lg border border-dashed border-zinc-200">
                        {group.orderIds.length > 0
                          ? t(
                              "deliveryView.radar.ordersInOtherDate",
                              "Los pedidos de este grupo pertenecen a otra fecha o filtro."
                            )
                          : t(
                              "deliveryView.radar.emptyGroup",
                              "Sin pedidos. Agrega pedidos disponibles abajo."
                            )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {groupOrders.map((item) => {
                          const isReady =
                            item.order.status?.toLowerCase() ===
                            "ready for delivery";
                          const total = calculateOrderTotal(
                            item.order.items || []
                          ).orderTotal;

                          return (
                            <div
                              key={item.order.id}
                              onClick={() => setInspectedOrder(item)}
                              className="p-2 rounded-lg bg-white border border-zinc-200 text-xs flex items-center justify-between gap-2 hover:border-zinc-300 active:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="size-2 rounded-full shrink-0"
                                  style={{ backgroundColor: group.color }}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-zinc-900">
                                      {getOrderDisplayNumber(
                                        item.order,
                                        orderPrefix
                                      )}
                                    </span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                        isReady
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {isReady
                                        ? t(
                                            "deliveryView.radar.statusTagReady",
                                            "Listo"
                                          )
                                        : t(
                                            "deliveryView.radar.statusTagKitchen",
                                            "Cocina"
                                          )}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                                    {item.order.customer?.name || "Cliente"}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                                    {item.order.customer?.address
                                      ? formatAddress(item.order.customer.address)
                                      : "-"}
                                  </div>
                                  <div className="mt-1">
                                    <RadarElapsedBadge order={item.order} />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-bold text-zinc-900">
                                  €{total.toFixed(2)}
                                </span>
                                {customGroups.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onStartMoveOrder(
                                        item.order.id,
                                        group.id
                                      );
                                    }}
                                    className="size-8 shrink-0 flex items-center justify-center text-zinc-600 border border-zinc-200 bg-white active:bg-zinc-100 rounded-lg transition-colors cursor-pointer touch-manipulation"
                                    title={t(
                                      "deliveryView.radar.moveToGroup",
                                      "Mover a otro grupo"
                                    )}
                                  >
                                    <ArrowRightLeft className="size-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveOrderFromGroup(
                                      group.id,
                                      item.order.id
                                    );
                                  }}
                                  className="size-8 shrink-0 flex items-center justify-center text-red-600 border border-zinc-200 bg-white active:bg-red-50 rounded-lg transition-colors cursor-pointer touch-manipulation"
                                  title={t(
                                    "deliveryView.radar.removeFromGroup",
                                    "Quitar del grupo"
                                  )}
                                >
                                  <X className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Available / Unassigned Orders Pool */}
        <div className="pt-2 border-t border-zinc-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                {t(
                  "deliveryView.radar.unassignedOrders",
                  "Pedidos Disponibles"
                )}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 font-bold">
                {unassignedGeocodedOrders.length}
              </span>
            </div>

            {/* Batch add checked orders to selected group */}
            {selectedCustomGroup && checkedUnassignedOrderIds.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onAddOrdersToGroup(
                    selectedCustomGroup.id,
                    checkedUnassignedOrderIds
                  )
                }
                className="flex items-center gap-1 px-3 min-h-8 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 touch-manipulation"
              >
                <Plus className="size-3.5" />
                <span>
                  {t("deliveryView.radar.addSelectedToGroup", {
                    count: checkedUnassignedOrderIds.length,
                  })}
                </span>
              </button>
            )}
          </div>

          {unassignedGeocodedOrders.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-400 bg-zinc-50 rounded-xl border border-zinc-200">
              <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-1 opacity-70" />
              <p className="font-semibold text-zinc-700">
                {t(
                  "deliveryView.radar.noUnassignedOrders",
                  "Todos los pedidos están en un grupo"
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {unassignedGeocodedOrders.map((item) => {
                const isReady =
                  item.order.status?.toLowerCase() === "ready for delivery";
                const isChecked = checkedUnassignedOrderIds.includes(
                  item.order.id
                );
                const total = calculateOrderTotal(
                  item.order.items || []
                ).orderTotal;

                return (
                  <div
                    key={item.order.id}
                    onClick={() => setInspectedOrder(item)}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isChecked
                        ? "border-black bg-zinc-100 font-semibold"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      {/* Padded label gives the checkbox a bigger tap area; stopPropagation
                          keeps the tap from also opening the inspector */}
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="size-8 shrink-0 flex items-center justify-center cursor-pointer touch-manipulation"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setCheckedUnassignedOrderIds((prev) =>
                              prev.includes(item.order.id)
                                ? prev.filter((id) => id !== item.order.id)
                                : [...prev, item.order.id]
                            );
                          }}
                          className="size-5 rounded text-black focus:ring-black cursor-pointer"
                        />
                      </label>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-900">
                            {getOrderDisplayNumber(item.order, orderPrefix)}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              isReady
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isReady
                              ? t("deliveryView.radar.statusTagReady", "Listo")
                              : t(
                                  "deliveryView.radar.statusTagKitchen",
                                  "Cocina"
                                )}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {item.order.customer?.name || "Cliente"} •{" "}
                          {item.distanceFromRestaurantKm} km
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {item.order.customer?.address
                            ? formatAddress(item.order.customer.address)
                            : "-"}
                        </div>
                        <div className="mt-1">
                          <RadarElapsedBadge order={item.order} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-zinc-900">
                        €{total.toFixed(2)}
                      </span>
                      {selectedCustomGroup && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddOrdersToGroup(selectedCustomGroup.id, [
                              item.order.id,
                            ]);
                          }}
                          className="size-8 shrink-0 flex items-center justify-center bg-black hover:bg-zinc-800 text-white rounded-lg transition-colors cursor-pointer active:scale-95 touch-manipulation"
                          title={`${t("deliveryView.radar.addToGroup", "Agregar a")} ${selectedCustomGroup.name}`}
                        >
                          <Plus className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Dispatch / Assignment Bar for Custom Groups */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-50 space-y-3">
        {selectedCustomGroup ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: selectedCustomGroup.color }}
                />
                {selectedCustomGroup.name}
                <RadarGroupDayBadge createdAt={selectedCustomGroup.createdAt} />
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-black text-white font-bold">
                {
                  geocodedOrders.filter(
                    (g) =>
                      selectedCustomGroup.orderIds.includes(g.order.id) &&
                      g.order.status?.toLowerCase() === "ready for delivery"
                  ).length
                }{" "}
                {t("deliveryView.radar.statusTagReady", "listos")}
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
                value={customGroupDriverId}
                onChange={(val) => setCustomGroupDriverId(val)}
                placeholder={t("deliveryView.radar.selectDriverPlaceholder")}
                className="w-full"
                portalClassName="delivery-radar-driver-portal"
              />
            </div>

            {/* Dispatch Button */}
            {(() => {
              const readyCount = geocodedOrders.filter(
                (g) =>
                  selectedCustomGroup.orderIds.includes(g.order.id) &&
                  g.order.status?.toLowerCase() === "ready for delivery"
              ).length;

              return (
                <button
                  type="button"
                  onClick={() => onDispatchCustomGroup(selectedCustomGroup)}
                  disabled={
                    isAssigning || readyCount === 0 || !customGroupDriverId
                  }
                  className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.01] cursor-pointer"
                >
                  {isAssigning ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      {t("deliveryView.radar.assigning", "Asignando...")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>
                        {readyCount > 0
                          ? t("deliveryView.radar.assignCustomGroup", {
                              count: readyCount,
                            })
                          : t(
                              "deliveryView.radar.assignCustomGroupNoReady",
                              "Sin pedidos listos"
                            )}
                      </span>
                    </>
                  )}
                </button>
              );
            })()}
          </>
        ) : (
          <div className="text-center py-2 text-xs text-zinc-500 bg-white p-3 rounded-xl border border-zinc-200">
            {t(
              "deliveryView.radar.selectGroupToAssign",
              "Selecciona un grupo arriba para asignar repartidor y despachar"
            )}
          </div>
        )}
      </div>
    </>
  );
};
