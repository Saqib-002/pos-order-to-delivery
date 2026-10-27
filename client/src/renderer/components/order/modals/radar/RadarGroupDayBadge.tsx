import React from "react";
import { useTranslation } from "react-i18next";
import { CalendarClock } from "lucide-react";

// Label for a custom group created on an earlier day: "Yesterday" or its date.
// Group numbers restart every day, so this tells yesterday's "Group 2" apart
// from today's. Today's groups get no label.
export const RadarGroupDayBadge: React.FC<{ createdAt?: string }> = ({
  createdAt,
}) => {
  const { t, i18n } = useTranslation();
  if (!createdAt) return null;

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (created >= todayStart) return null;

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const label =
    created >= yesterdayStart
      ? t("deliveryView.radar.groupYesterday")
      : created.toLocaleDateString(i18n.language || undefined, {
          day: "numeric",
          month: "short",
        });

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0 whitespace-nowrap"
      title={created.toLocaleString(i18n.language || undefined)}
    >
      <CalendarClock className="size-3" />
      {label}
    </span>
  );
};
