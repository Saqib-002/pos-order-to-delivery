import React, { useState, useEffect } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { RichTextEditor, blocknoteToPlainText, plainTextToBlocknote } from "./RichTextEditor";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { LocalisedString } from "./HeroTab";
import { Trash2, FileText } from "lucide-react";

export interface TermsSection {
  id: string;
  title: LocalisedString;
  body: LocalisedString;
}

export interface TermsContent {
  title: LocalisedString;
  sections: TermsSection[];
}

const EMPTY_TERMS: TermsContent = {
  title: {
    en: "",
    es: "",
  },
  sections: [],
};

interface TermsTabProps {
  initialContent?: TermsContent;
  onSaveSuccess?: () => void;
}

export const TermsTab: React.FC<TermsTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const [content, setContent] = useState<TermsContent>(EMPTY_TERMS);
  const [saving, setSaving] = useState(false);

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

  const addSection = () => {
    const id = `section-${Date.now()}`;
    setContent((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id,
          title: { en: "", es: "" },
          body: { en: "", es: "" },
        },
      ],
    }));
  };

  const updateTitle = (id: string, lang: "en" | "es", val: string) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, title: { ...s.title, [lang]: val } } : s
      ),
    }));
  };

  const updateBody = (id: string, lang: "en" | "es", val: string) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, body: { ...s.body, [lang]: val } } : s
      ),
    }));
  };

  const removeSection = (id: string) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const res = await (window as any).electronAPI.saveSiteContent(
          token,
          "terms",
          content
        );
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
      {/* Document Title Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {t("webAdmin.terms.title")}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.terms.subtitle")}
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
            name="termsTitleEn"
            label={`${t("webAdmin.terms.docTitle")} (EN)`}
            labelAction={
              <TranslateButton
                value={content.title.en}
                direction="en→es"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    title: { ...content.title, es: v },
                  })
                }
              />
            }
            value={content.title.en}
            placeholder={t("webAdmin.terms.docTitlePlaceholderEn")}
            onChange={(e) =>
              setContent({
                ...content,
                title: { ...content.title, en: e.target.value },
              })
            }
          />
          <CustomInput
            type="text"
            name="termsTitleEs"
            label={`${t("webAdmin.terms.docTitle")} (ES)`}
            labelAction={
              <TranslateButton
                value={content.title.es}
                direction="es→en"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    title: { ...content.title, en: v },
                  })
                }
              />
            }
            value={content.title.es}
            placeholder={t("webAdmin.terms.docTitlePlaceholderEs")}
            onChange={(e) =>
              setContent({
                ...content,
                title: { ...content.title, es: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* Sections List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {t("webAdmin.terms.sectionsTitle")} ({content.sections.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.terms.sectionsSubtitle")}
            </p>
          </div>
          <CustomButton
            type="button"
            variant="secondary"
            onClick={addSection}
            label={t("webAdmin.terms.addSection")}
          />
        </div>

        {content.sections.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-3">{t("webAdmin.terms.noSections")}</p>
            <CustomButton
              type="button"
              variant="secondary"
              onClick={addSection}
              label={t("webAdmin.terms.addSection")}
              className="mx-auto"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {content.sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("webAdmin.terms.sectionNumber")} #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSection(sec.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("webAdmin.common.delete")}</span>
                  </button>
                </div>

                {/* Section Titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomInput
                    type="text"
                    name={`secTitleEn_${sec.id}`}
                    label={`${t("webAdmin.terms.sectionTitle")} (EN)`}
                    labelAction={
                      <TranslateButton
                        value={sec.title.en}
                        direction="en→es"
                        onTranslated={(v) => updateTitle(sec.id, "es", v)}
                      />
                    }
                    value={sec.title.en}
                    placeholder={t("webAdmin.terms.sectionTitlePlaceholderEn")}
                    onChange={(e) =>
                      updateTitle(sec.id, "en", e.target.value)
                    }
                  />
                  <CustomInput
                    type="text"
                    name={`secTitleEs_${sec.id}`}
                    label={`${t("webAdmin.terms.sectionTitle")} (ES)`}
                    labelAction={
                      <TranslateButton
                        value={sec.title.es}
                        direction="es→en"
                        onTranslated={(v) => updateTitle(sec.id, "en", v)}
                      />
                    }
                    value={sec.title.es}
                    placeholder={t("webAdmin.terms.sectionTitlePlaceholderEs")}
                    onChange={(e) =>
                      updateTitle(sec.id, "es", e.target.value)
                    }
                  />
                </div>

                {/* Section Bodies (BlockNote RichTextEditor) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <RichTextEditor
                      label={`${t("webAdmin.terms.sectionBody")} (EN)`}
                      labelAction={
                        <TranslateButton
                          value={blocknoteToPlainText(sec.body.en)}
                          direction="en→es"
                          onTranslated={(v) =>
                            updateBody(sec.id, "es", plainTextToBlocknote(v))
                          }
                        />
                      }
                      value={sec.body.en}
                      onChange={(val) => updateBody(sec.id, "en", val)}
                      minHeight="140px"
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      label={`${t("webAdmin.terms.sectionBody")} (ES)`}
                      labelAction={
                        <TranslateButton
                          value={blocknoteToPlainText(sec.body.es)}
                          direction="es→en"
                          onTranslated={(v) =>
                            updateBody(sec.id, "en", plainTextToBlocknote(v))
                          }
                        />
                      }
                      value={sec.body.es}
                      onChange={(val) => updateBody(sec.id, "es", val)}
                      minHeight="140px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <CustomButton
          type="submit"
          variant="primary"
          isLoading={saving}
          label={
            saving ? t("webAdmin.actions.saving") : t("webAdmin.actions.save")
          }
        />
      </div>
    </form>
  );
};

export default TermsTab;
