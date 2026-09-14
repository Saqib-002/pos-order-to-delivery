import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import CustomInput from "../shared/CustomInput";
import TranslateButton from "./TranslateButton";
import {
  RichTextEditor,
  blocknoteToPlainText,
  plainTextToBlocknote,
} from "./RichTextEditor";
import type { LocalisedString } from "./HeroTab";

export interface SectionItem {
  id: string;
  title: LocalisedString;
  body: LocalisedString;
}

interface SortableSectionCardProps {
  section: SectionItem;
  idx: number;
  /** Label prefix shown in the header, e.g. "Section" or "Allergen" */
  label: string;
  titleLabelEn: string;
  titleLabelEs: string;
  bodyLabelEn: string;
  bodyLabelEs: string;
  titlePlaceholderEn: string;
  titlePlaceholderEs: string;
  onUpdateTitle: (id: string, lang: "en" | "es", val: string) => void;
  onUpdateBody: (id: string, lang: "en" | "es", val: string) => void;
  onRemove: (id: string) => void;
}

const SortableSectionCard: React.FC<SortableSectionCardProps> = ({
  section,
  idx,
  label,
  titleLabelEn,
  titleLabelEs,
  bodyLabelEn,
  bodyLabelEs,
  titlePlaceholderEn,
  titlePlaceholderEs,
  onUpdateTitle,
  onUpdateBody,
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
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  const previewText =
    section.title.en ||
    section.title.es ||
    t("webAdmin.common.untitled", "Untitled");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
    >
      {/* ── Header — click anywhere except grip to toggle ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 touch-none"
          title={t("webAdmin.common.dragToReorder", "Drag to reorder")}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <span className="text-xs font-bold text-gray-400 flex-shrink-0">
          #{idx + 1}
        </span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex-shrink-0">
          {label}
        </span>
        <span className="text-[11px] text-gray-600 truncate flex-1 min-w-0">
          {previewText}
        </span>

        <span className="text-gray-400 flex-shrink-0">
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-4">
          {/* Title EN + ES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              type="text"
              name={`secTitleEn_${section.id}`}
              label={titleLabelEn}
              labelAction={
                <TranslateButton
                  value={section.title.en}
                  direction="en→es"
                  onTranslated={(v) => onUpdateTitle(section.id, "es", v)}
                />
              }
              value={section.title.en}
              placeholder={titlePlaceholderEn}
              onChange={(e) => onUpdateTitle(section.id, "en", e.target.value)}
            />
            <CustomInput
              type="text"
              name={`secTitleEs_${section.id}`}
              label={titleLabelEs}
              labelAction={
                <TranslateButton
                  value={section.title.es}
                  direction="es→en"
                  onTranslated={(v) => onUpdateTitle(section.id, "en", v)}
                />
              }
              value={section.title.es}
              placeholder={titlePlaceholderEs}
              onChange={(e) => onUpdateTitle(section.id, "es", e.target.value)}
            />
          </div>

          {/* Body EN + ES (RichTextEditor) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RichTextEditor
              label={bodyLabelEn}
              labelAction={
                <TranslateButton
                  value={blocknoteToPlainText(section.body.en)}
                  direction="en→es"
                  onTranslated={(v) =>
                    onUpdateBody(section.id, "es", plainTextToBlocknote(v))
                  }
                />
              }
              value={section.body.en}
              onChange={(val) => onUpdateBody(section.id, "en", val)}
              minHeight="140px"
            />
            <RichTextEditor
              label={bodyLabelEs}
              labelAction={
                <TranslateButton
                  value={blocknoteToPlainText(section.body.es)}
                  direction="es→en"
                  onTranslated={(v) =>
                    onUpdateBody(section.id, "en", plainTextToBlocknote(v))
                  }
                />
              }
              value={section.body.es}
              onChange={(val) => onUpdateBody(section.id, "es", val)}
              minHeight="140px"
            />
          </div>

          {/* Delete — only visible when open */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onRemove(section.id)}
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

export default SortableSectionCard;
