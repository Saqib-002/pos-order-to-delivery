import React from "react";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { Order } from "@/types/order";
import { getOrderElapsedTime } from "./radarTypes";

// "Ready since X" / "In kitchen X" badge shown on radar order rows
export const RadarElapsedBadge: React.FC<{ order: Order }> = ({ order }) => {
  const { t } = useTranslation();
  const isReady = order.status?.toLowerCase() === "ready for delivery";
  const time = getOrderElapsedTime(order).text;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
        isReady
          ? "bg-emerald-100/70 text-emerald-800"
          : "bg-amber-100/70 text-amber-900"
      }`}
    >
      <Clock className="size-2.5" />
      {isReady
        ? t("deliveryView.radar.readySinceLabel", { time })
        : t("deliveryView.radar.kitchenSinceLabel", { time })}
    </span>
  );
};
