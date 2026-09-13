import React, { useState, useEffect } from "react";
import CustomButton from "../ui/CustomButton";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { LocalisedString } from "./HeroTab";
import { HelpCircle } from "lucide-react";
import SortableFaqCard from "./SortableFaqCard";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

export interface FaqItem {
  id: string;
  category: LocalisedString;
  question: LocalisedString;
  answer: LocalisedString;
}

export interface FaqContent {
  items: FaqItem[];
}

const DEFAULT_FAQ: FaqContent = { items: [] };

interface FaqTabProps {
  initialContent?: FaqContent;
  onSaveSuccess?: () => void;
}

export const FaqTab: React.FC<FaqTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const [content, setContent] = useState<FaqContent>(DEFAULT_FAQ);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (initialContent && Array.isArray(initialContent.items)) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const addItem = () =>
    setContent((prev) => ({
      items: [
        ...prev.items,
        {
          id: `faq-${Date.now()}`,
          category: { en: "", es: "" },
          question: { en: "", es: "" },
          answer: { en: "", es: "" },
        },
      ],
    }));

  const updateField = (
    id: string,
    field: "category" | "question" | "answer",
    lang: "en" | "es",
    val: string
  ) =>
    setContent((prev) => ({
      items: prev.items.map((item) =>
        item.id === id
          ? { ...item, [field]: { ...item[field], [lang]: val } }
          : item
      ),
    }));

  const removeItem = (id: string) =>
    setContent((prev) => ({ items: prev.items.filter((item) => item.id !== id) }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setContent((prev) => {
      const oldIndex = prev.items.findIndex((item) => item.id === active.id);
      const newIndex = prev.items.findIndex((item) => item.id === over.id);
      return { items: arrayMove(prev.items, oldIndex, newIndex) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const res = await (window as any).electronAPI.saveSiteContent(token, "faq", content);
        if (res?.status) {
          toast.success(t("webAdmin.messages.saveSuccess"));
          onSaveSuccess?.();
        } else {
          toast.error(res?.message || t("webAdmin.messages.saveError"));
        }
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-full">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {t("webAdmin.faq.title")} ({content.items.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.faq.subtitle")}
            </p>
          </div>
          <CustomButton
            type="button"
            variant="secondary"
            onClick={addItem}
            label={t("webAdmin.faq.addQuestion")}
          />
        </div>

        {content.items.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-3">{t("webAdmin.faq.noQuestions")}</p>
            <CustomButton
              type="button"
              variant="secondary"
              onClick={addItem}
              label={t("webAdmin.faq.addQuestion")}
            />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={content.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {content.items.map((item, idx) => (
                  <SortableFaqCard
                    key={item.id}
                    item={item}
                    idx={idx}
                    onUpdate={updateField}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <CustomButton
          type="submit"
          variant="primary"
          isLoading={saving}
          label={saving ? t("webAdmin.actions.saving") : t("webAdmin.actions.save")}
        />
      </div>
    </form>
  );
};

export default FaqTab;
