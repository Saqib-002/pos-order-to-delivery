import React, { useState, useEffect } from "react";
import CustomButton from "../ui/CustomButton";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { LocalisedString } from "./HeroTab";
import { Leaf } from "lucide-react";
import SortableSectionCard, { type SectionItem } from "./SortableSectionCard";
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

export interface AllergenSection {
  id: string;
  title: LocalisedString;
  body: LocalisedString;
}

export interface AllergensContent {
  sections: AllergenSection[];
}

const DEFAULT_ALLERGENS: AllergensContent = { sections: [] };

interface AllergensTabProps {
  initialContent?: AllergensContent;
  onSaveSuccess?: () => void;
}

export const AllergensTab: React.FC<AllergensTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const [content, setContent] = useState<AllergensContent>(DEFAULT_ALLERGENS);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (initialContent && Array.isArray(initialContent.sections)) {
      setContent({
        sections: initialContent.sections.map((s) => ({
          id: s.id || `allergen-${Date.now()}-${Math.random()}`,
          title: { en: s.title?.en || "", es: s.title?.es || "" },
          body: { en: s.body?.en || "", es: s.body?.es || "" },
        })),
      });
    }
  }, [initialContent]);

  const addSection = () => {
    setContent((prev) => ({
      sections: [
        ...prev.sections,
        { id: `allergen-${Date.now()}`, title: { en: "", es: "" }, body: { en: "", es: "" } },
      ],
    }));
  };

  const updateTitle = (id: string, lang: "en" | "es", val: string) =>
    setContent((prev) => ({
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, title: { ...s.title, [lang]: val } } : s
      ),
    }));

  const updateBody = (id: string, lang: "en" | "es", val: string) =>
    setContent((prev) => ({
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, body: { ...s.body, [lang]: val } } : s
      ),
    }));

  const removeSection = (id: string) =>
    setContent((prev) => ({ sections: prev.sections.filter((s) => s.id !== id) }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setContent((prev) => {
      const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
      const newIndex = prev.sections.findIndex((s) => s.id === over.id);
      return { sections: arrayMove(prev.sections, oldIndex, newIndex) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const res = await (window as any).electronAPI.saveSiteContent(token, "allergens", content);
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
              {t("webAdmin.allergens.title")} ({content.sections.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.allergens.subtitle")}
            </p>
          </div>
          <CustomButton
            type="button"
            variant="secondary"
            onClick={addSection}
            label={t("webAdmin.allergens.addSection")}
          />
        </div>

        {content.sections.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <Leaf className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-3">{t("webAdmin.allergens.noSections")}</p>
            <CustomButton
              type="button"
              variant="secondary"
              onClick={addSection}
              label={t("webAdmin.allergens.addSection")}
              className="mx-auto"
            />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={content.sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {content.sections.map((sec, idx) => (
                  <SortableSectionCard
                    key={sec.id}
                    section={sec as SectionItem}
                    idx={idx}
                    label={t("webAdmin.allergens.sectionNumber")}
                    titleLabelEn={`${t("webAdmin.allergens.sectionTitle")} (EN)`}
                    titleLabelEs={`${t("webAdmin.allergens.sectionTitle")} (ES)`}
                    bodyLabelEn={`${t("webAdmin.allergens.sectionBody")} (EN)`}
                    bodyLabelEs={`${t("webAdmin.allergens.sectionBody")} (ES)`}
                    titlePlaceholderEn={t("webAdmin.allergens.sectionTitlePlaceholderEn")}
                    titlePlaceholderEs={t("webAdmin.allergens.sectionTitlePlaceholderEs")}
                    onUpdateTitle={updateTitle}
                    onUpdateBody={updateBody}
                    onRemove={removeSection}
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

export default AllergensTab;
