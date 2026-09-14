import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import CustomInput from "../shared/CustomInput";
import TranslateButton from "./TranslateButton";
import type { AboutMilestone } from "./AboutTab";

interface SortableMilestoneCardProps {
  milestone: AboutMilestone;
  idx: number;
  onUpdate: (
    id: string,
    field: "year" | "text",
    val: string | { en?: string; es?: string }
  ) => void;
  onRemove: (id: string) => void;
}

const SortableMilestoneCard: React.FC<SortableMilestoneCardProps> = ({
  milestone,
  idx,
  onUpdate,
  onRemove,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  // A short label to show in the collapsed header: year + first available text
  const previewText =
    milestone.text.en || milestone.text.es || t("webAdmin.about.noDescription", "No description");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
    >
      {/* ── Header (always visible) ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none hover:bg-gray-100 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Drag handle — click stops accordion toggle, pointer events handled by dnd-kit listeners */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 touch-none"
          title={t("webAdmin.about.dragToReorder", "Drag to reorder")}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Index + year badge */}
        <span className="text-xs font-bold text-gray-400 flex-shrink-0">
          #{idx + 1}
        </span>
        <span className="text-xs font-bold text-gray-800 flex-shrink-0 min-w-[3rem]">
          {milestone.year || "—"}
        </span>

        {/* Preview text – truncated */}
        <span className="text-[11px] text-gray-500 truncate flex-1 min-w-0">
          {previewText}
        </span>

        {/* Chevron indicator (non-interactive, just visual) */}
        <span className="text-gray-400 flex-shrink-0 pointer-events-none">
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-200 space-y-3">
          {/* Year field */}
          <div className="max-w-[8rem]">
            <CustomInput
              type="text"
              name={`milestoneYear_${milestone.id}`}
              label={t("webAdmin.about.yearLabel", "Year")}
              value={milestone.year}
              placeholder={t("webAdmin.about.yearPlaceholder")}
              onChange={(e) => onUpdate(milestone.id, "year", e.target.value)}
            />
          </div>

          {/* Description EN + ES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* EN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {t("webAdmin.about.description")} (EN)
                </label>
                <TranslateButton
                  value={milestone.text.en}
                  direction="en→es"
                  onTranslated={(v) =>
                    onUpdate(milestone.id, "text", { es: v })
                  }
                />
              </div>
              <textarea
                rows={2}
                value={milestone.text.en}
                onChange={(e) =>
                  onUpdate(milestone.id, "text", { en: e.target.value })
                }
                placeholder={t("webAdmin.about.descriptionPlaceholderEn")}
                className="w-full touch-manipulation px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-xs text-gray-800"
              />
            </div>

            {/* ES */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {t("webAdmin.about.description")} (ES)
                </label>
                <TranslateButton
                  value={milestone.text.es}
                  direction="es→en"
                  onTranslated={(v) =>
                    onUpdate(milestone.id, "text", { en: v })
                  }
                />
              </div>
              <textarea
                rows={2}
                value={milestone.text.es}
                onChange={(e) =>
                  onUpdate(milestone.id, "text", { es: e.target.value })
                }
                placeholder={t("webAdmin.about.descriptionPlaceholderEs")}
                className="w-full touch-manipulation px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-xs text-gray-800"
              />
            </div>
          </div>

          {/* Delete – only visible when expanded */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onRemove(milestone.id)}
              className="px-3 py-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t("webAdmin.common.delete")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortableMilestoneCard;
