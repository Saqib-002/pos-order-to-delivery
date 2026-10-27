import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightLeft, X } from "lucide-react";
import type { CustomRadarGroup } from "./radarTypes";
import { RadarGroupDayBadge } from "./RadarGroupDayBadge";

interface RadarMoveOrderModalProps {
  movingOrderState: { orderId: string; currentGroupId: string } | null;
  customGroups: CustomRadarGroup[];
  onClose: () => void;
  onMoveOrder: (
    orderId: string,
    fromGroupId: string,
    toGroupId: string
  ) => void;
}

export const RadarMoveOrderModal: React.FC<RadarMoveOrderModalProps> = ({
  movingOrderState,
  customGroups,
  onClose,
  onMoveOrder,
}) => {
  const { t } = useTranslation();

  if (!movingOrderState) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm space-y-4 border border-zinc-200">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-zinc-700" />
            <h4 className="text-sm font-bold text-zinc-900">
              {t("deliveryView.radar.moveToGroup", "Mover al grupo")}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {customGroups
            .filter((g) => g.id !== movingOrderState.currentGroupId)
            .map((targetGroup) => (
              <button
                key={targetGroup.id}
                type="button"
                onClick={() =>
                  onMoveOrder(
                    movingOrderState.orderId,
                    movingOrderState.currentGroupId,
                    targetGroup.id
                  )
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 transition-colors text-left text-xs font-bold text-zinc-800 border border-zinc-200 shadow-2xs cursor-pointer active:scale-98"
              >
                <span
                  className="size-4 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: targetGroup.color }}
                />
                <span className="truncate flex-1">{targetGroup.name}</span>
                <RadarGroupDayBadge createdAt={targetGroup.createdAt} />
                <span className="text-[10px] text-zinc-400 font-semibold px-2 py-0.5 rounded-md bg-zinc-100">
                  {targetGroup.orderIds.length}{" "}
                  {t("deliveryView.radar.ordersCount", "pedidos")}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
