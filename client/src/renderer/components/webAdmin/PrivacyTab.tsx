import React, { useState, useEffect } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { LocalisedString } from "./HeroTab";
import { ShieldCheck } from "lucide-react";
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

export interface PrivacySection {
  id: string;
  title: LocalisedString;
  body: LocalisedString;
}

export interface PrivacyContent {
  title: LocalisedString;
  sections: PrivacySection[];
}

const EMPTY_PRIVACY: PrivacyContent = {
  title: { en: "", es: "" },
  sections: [],
};

interface PrivacyTabProps {
  initialContent?: PrivacyContent;
  onSaveSuccess?: () => void;
}

export const PrivacyTab: React.FC<PrivacyTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const [content, setContent] = useState<PrivacyContent>(EMPTY_PRIVACY);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (initialContent) {
      setContent({
        title: {
          en: initialContent.title?.en || "",
          es: initialContent.title?.es || "",
        },
        sections: Array.isArray(initialContent.sections)
          ? initialContent.sections.map((s) => ({
              id: s.id || `section-${Date.now()}-${Math.random()}`,
              title: { en: s.title?.en || "", es: s.title?.es || "" },
              body: { en: s.body?.en || "", es: s.body?.es || "" },
            }))
          : [],
      });
    }
  }, [initialContent]);

  const addSection = () =>
    setContent((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: `section-${Date.now()}`, title: { en: "", es: "" }, body: { en: "", es: "" } },
      ],
    }));

  const updateTitle = (id: string, lang: "en" | "es", val: string) =>
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, title: { ...s.title, [lang]: val } } : s
      ),
    }));

  const updateBody = (id: string, lang: "en" | "es", val: string) =>
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, body: { ...s.body, [lang]: val } } : s
      ),
    }));

  const removeSection = (id: string) =>
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setContent((prev) => {
      const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
      const newIndex = prev.sections.findIndex((s) => s.id === over.id);
      return { ...prev, sections: arrayMove(prev.sections, oldIndex, newIndex) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const res = await (window as any).electronAPI.saveSiteContent(token, "privacy", content);
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
      {/* Document Title */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {t("webAdmin.privacy.title")}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.privacy.subtitle")}
            </p>
          </div>
          <div className="flex gap-4">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {t("webAdmin.common.english")}
            </span>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {t("webAdmin.common.espanol")}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            type="text"
            name="privacyTitleEn"
            label={`${t("webAdmin.privacy.docTitle")} (EN)`}
            labelAction={
              <TranslateButton
                value={content.title.en}
                direction="en→es"
                onTranslated={(v) =>
                  setContent({ ...content, title: { ...content.title, es: v } })
                }
              />
            }
            value={content.title.en}
            placeholder={t("webAdmin.privacy.docTitlePlaceholderEn")}
            onChange={(e) =>
              setContent({ ...content, title: { ...content.title, en: e.target.value } })
            }
          />
          <CustomInput
            type="text"
            name="privacyTitleEs"
            label={`${t("webAdmin.privacy.docTitle")} (ES)`}
            labelAction={
              <TranslateButton
                value={content.title.es}
                direction="es→en"
                onTranslated={(v) =>
                  setContent({ ...content, title: { ...content.title, en: v } })
                }
              />
            }
            value={content.title.es}
            placeholder={t("webAdmin.privacy.docTitlePlaceholderEs")}
            onChange={(e) =>
              setContent({ ...content, title: { ...content.title, es: e.target.value } })
            }
          />
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {t("webAdmin.privacy.sectionsTitle")} ({content.sections.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.privacy.sectionsSubtitle")}
            </p>
          </div>
          <CustomButton
            type="button"
            variant="secondary"
            onClick={addSection}
            label={t("webAdmin.privacy.addSection")}
          />
        </div>

        {content.sections.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <ShieldCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-3">{t("webAdmin.privacy.noSections")}</p>
            <CustomButton
              type="button"
              variant="secondary"
              onClick={addSection}
              label={t("webAdmin.privacy.addSection")}
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
                    label={t("webAdmin.privacy.sectionNumber")}
                    titleLabelEn={`${t("webAdmin.privacy.sectionTitle")} (EN)`}
                    titleLabelEs={`${t("webAdmin.privacy.sectionTitle")} (ES)`}
                    bodyLabelEn={`${t("webAdmin.privacy.sectionBody")} (EN)`}
                    bodyLabelEs={`${t("webAdmin.privacy.sectionBody")} (ES)`}
                    titlePlaceholderEn={t("webAdmin.privacy.sectionTitlePlaceholderEn")}
                    titlePlaceholderEs={t("webAdmin.privacy.sectionTitlePlaceholderEs")}
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

export default PrivacyTab;
