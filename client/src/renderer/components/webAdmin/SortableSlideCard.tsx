import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Fullscreen,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatImageUrl } from "../../utils/imageUrl";
import ImagePreviewModal from "../shared/ImagePreviewModal";
import type { HeroSlide } from "./HeroTab";

interface SortableSlideCardProps {
  slide: HeroSlide;
  idx: number;
  driverApiUrl: string;
  onToggleVisible: (id: string) => void;
  onEdit: (slide: HeroSlide) => void;
  onDelete: (id: string) => void;
}

const SortableSlideCard: React.FC<SortableSlideCardProps> = ({
  slide,
  idx,
  driverApiUrl,
  onToggleVisible,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  const displaySrc = formatImageUrl(slide.image, driverApiUrl);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col justify-between gap-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 touch-none"
              title={t("webAdmin.hero.dragToReorder")}            >
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-lg bg-gray-200 border border-gray-300 overflow-hidden flex items-center justify-center flex-shrink-0">
              {displaySrc ? (
                <img
                  src={displaySrc}
                  alt={slide.name.en || "Slide"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {/* Name & position */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-500">
                  #{idx + 1}
                </span>
                <h4 className="text-xs font-bold text-gray-900">
                  {slide.name.es || slide.name.en}
                </h4>
              </div>
              <p className="text-[11px] text-gray-500">{slide.name.en}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* View full image */}
            {displaySrc && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setPreviewOpen(true)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded text-xs transition-colors cursor-pointer"
                title={t("webAdmin.hero.viewImage")}
              >
                <Fullscreen className="w-4 h-4" />
              </button>
            )}

            {/* Toggle visibility */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onToggleVisible(slide.id)}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                slide.visible
                  ? "text-emerald-600 hover:bg-emerald-50"
                  : "text-gray-400 hover:bg-gray-200"
              }`}
              title={
                slide.visible
                  ? t("webAdmin.hero.visible")
                  : t("webAdmin.hero.hidden")
              }
            >
              {slide.visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>

            {/* Edit */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onEdit(slide)}
              className="p-1 text-gray-600 hover:bg-gray-200 rounded text-xs transition-colors cursor-pointer"
              title={t("webAdmin.common.edit")}
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDelete(slide.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded text-xs transition-colors cursor-pointer"
              title={t("webAdmin.common.delete")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen image preview */}
      {previewOpen && displaySrc && (
        <ImagePreviewModal
          src={displaySrc}
          alt={slide.name.es || slide.name.en || "Slide"}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
};

export default SortableSlideCard;
