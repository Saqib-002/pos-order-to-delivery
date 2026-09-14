import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import CustomInput from "../shared/CustomInput";
import TranslateButton from "./TranslateButton";
import type { FaqItem } from "./FaqTab";

interface SortableFaqCardProps {
  item: FaqItem;
  idx: number;
  onUpdate: (
    id: string,
    field: "category" | "question" | "answer",
    lang: "en" | "es",
    val: string
  ) => void;
  onRemove: (id: string) => void;
}

const SortableFaqCard: React.FC<SortableFaqCardProps> = ({
  item,
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
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  const previewText =
    item.question.en ||
    item.question.es ||
    t("webAdmin.faq.noQuestion", "No question");

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
          FAQ
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
          {/* Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              type="text"
              name={`faqCatEn_${item.id}`}
              label={`${t("webAdmin.faq.category")} (EN)`}
              labelAction={
                <TranslateButton
                  value={item.category.en}
                  direction="en→es"
                  onTranslated={(v) => onUpdate(item.id, "category", "es", v)}
                />
              }
              value={item.category.en}
              placeholder={t("webAdmin.faq.categoryPlaceholderEn")}
              onChange={(e) =>
                onUpdate(item.id, "category", "en", e.target.value)
              }
            />
            <CustomInput
              type="text"
              name={`faqCatEs_${item.id}`}
              label={`${t("webAdmin.faq.category")} (ES)`}
              labelAction={
                <TranslateButton
                  value={item.category.es}
                  direction="es→en"
                  onTranslated={(v) => onUpdate(item.id, "category", "en", v)}
                />
              }
              value={item.category.es}
              placeholder={t("webAdmin.faq.categoryPlaceholderEs")}
              onChange={(e) =>
                onUpdate(item.id, "category", "es", e.target.value)
              }
            />
          </div>

          {/* Question */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              type="text"
              name={`faqQEn_${item.id}`}
              label={`${t("webAdmin.faq.question")} (EN)`}
              labelAction={
                <TranslateButton
                  value={item.question.en}
                  direction="en→es"
                  onTranslated={(v) => onUpdate(item.id, "question", "es", v)}
                />
              }
              value={item.question.en}
              placeholder={t("webAdmin.faq.questionPlaceholderEn")}
              onChange={(e) =>
                onUpdate(item.id, "question", "en", e.target.value)
              }
            />
            <CustomInput
              type="text"
              name={`faqQEs_${item.id}`}
              label={`${t("webAdmin.faq.question")} (ES)`}
              labelAction={
                <TranslateButton
                  value={item.question.es}
                  direction="es→en"
                  onTranslated={(v) => onUpdate(item.id, "question", "en", v)}
                />
              }
              value={item.question.es}
              placeholder={t("webAdmin.faq.questionPlaceholderEs")}
              onChange={(e) =>
                onUpdate(item.id, "question", "es", e.target.value)
              }
            />
          </div>

          {/* Answer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {t("webAdmin.faq.answer")} (EN)
                </label>
                <TranslateButton
                  value={item.answer.en}
                  direction="en→es"
                  onTranslated={(v) => onUpdate(item.id, "answer", "es", v)}
                />
              </div>
              <textarea
                rows={3}
                value={item.answer.en}
                onChange={(e) =>
                  onUpdate(item.id, "answer", "en", e.target.value)
                }
                placeholder={t("webAdmin.faq.answerPlaceholderEn")}
                className="w-full touch-manipulation px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-xs text-gray-800"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  {t("webAdmin.faq.answer")} (ES)
                </label>
                <TranslateButton
                  value={item.answer.es}
                  direction="es→en"
                  onTranslated={(v) => onUpdate(item.id, "answer", "en", v)}
                />
              </div>
              <textarea
                rows={3}
                value={item.answer.es}
                onChange={(e) =>
                  onUpdate(item.id, "answer", "es", e.target.value)
                }
                placeholder={t("webAdmin.faq.answerPlaceholderEs")}
                className="w-full touch-manipulation px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-xs text-gray-800"
              />
            </div>
          </div>

          {/* Delete — only visible when open */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onRemove(item.id)}
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

export default SortableFaqCard;
