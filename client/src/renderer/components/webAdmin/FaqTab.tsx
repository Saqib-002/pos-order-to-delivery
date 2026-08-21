import React, { useState, useEffect } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { LocalisedString } from "./HeroTab";
import { Trash2, HelpCircle } from "lucide-react";

export interface FaqItem {
  id: string;
  category: LocalisedString;
  question: LocalisedString;
  answer: LocalisedString;
}

export interface FaqContent {
  items: FaqItem[];
}

const DEFAULT_FAQ: FaqContent = {
  items: [],
};

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

  useEffect(() => {
    if (initialContent && Array.isArray(initialContent.items)) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const addItem = () => {
    const id = `faq-${Date.now()}`;
    setContent((prev) => ({
      items: [
        ...prev.items,
        {
          id,
          category: { en: "", es: "" },
          question: { en: "", es: "" },
          answer: { en: "", es: "" },
        },
      ],
    }));
  };

  const updateField = (
    id: string,
    field: "category" | "question" | "answer",
    lang: "en" | "es",
    val: string
  ) => {
    setContent((prev) => ({
      items: prev.items.map((item) =>
        item.id === id
          ? { ...item, [field]: { ...item[field], [lang]: val } }
          : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    setContent((prev) => ({
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const res = await (window as any).electronAPI.saveSiteContent(
          token,
          "faq",
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
          <div className="space-y-5">
            {content.items.map((item, idx) => (
              <div
                key={item.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    FAQ #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("webAdmin.common.delete")}</span>
                  </button>
                </div>

                {/* Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomInput
                    type="text"
                    name={`faqCategoryEn_${item.id}`}
                    label={`${t("webAdmin.faq.category")} (EN)`}
                    labelAction={
                      <TranslateButton
                        value={item.category.en}
                        direction="en→es"
                        onTranslated={(v) =>
                          updateField(item.id, "category", "es", v)
                        }
                      />
                    }
                    value={item.category.en}
                    placeholder={t("webAdmin.faq.categoryPlaceholderEn")}
                    onChange={(e) =>
                      updateField(item.id, "category", "en", e.target.value)
                    }
                  />
                  <CustomInput
                    type="text"
                    name={`faqCategoryEs_${item.id}`}
                    label={`${t("webAdmin.faq.category")} (ES)`}
                    labelAction={
                      <TranslateButton
                        value={item.category.es}
                        direction="es→en"
                        onTranslated={(v) =>
                          updateField(item.id, "category", "en", v)
                        }
                      />
                    }
                    value={item.category.es}
                    placeholder={t("webAdmin.faq.categoryPlaceholderEs")}
                    onChange={(e) =>
                      updateField(item.id, "category", "es", e.target.value)
                    }
                  />
                </div>

                {/* Question */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomInput
                    type="text"
                    name={`faqQuestionEn_${item.id}`}
                    label={`${t("webAdmin.faq.question")} (EN)`}
                    labelAction={
                      <TranslateButton
                        value={item.question.en}
                        direction="en→es"
                        onTranslated={(v) =>
                          updateField(item.id, "question", "es", v)
                        }
                      />
                    }
                    value={item.question.en}
                    placeholder={t("webAdmin.faq.questionPlaceholderEn")}
                    onChange={(e) =>
                      updateField(item.id, "question", "en", e.target.value)
                    }
                  />
                  <CustomInput
                    type="text"
                    name={`faqQuestionEs_${item.id}`}
                    label={`${t("webAdmin.faq.question")} (ES)`}
                    labelAction={
                      <TranslateButton
                        value={item.question.es}
                        direction="es→en"
                        onTranslated={(v) =>
                          updateField(item.id, "question", "en", v)
                        }
                      />
                    }
                    value={item.question.es}
                    placeholder={t("webAdmin.faq.questionPlaceholderEs")}
                    onChange={(e) =>
                      updateField(item.id, "question", "es", e.target.value)
                    }
                  />
                </div>

                {/* Answer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("webAdmin.faq.answer")} (EN)
                      </label>
                      <TranslateButton
                        value={item.answer.en}
                        direction="en→es"
                        onTranslated={(v) =>
                          updateField(item.id, "answer", "es", v)
                        }
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={item.answer.en}
                      onChange={(e) =>
                        updateField(item.id, "answer", "en", e.target.value)
                      }
                      placeholder={t("webAdmin.faq.answerPlaceholderEn")}
                      className="w-full touch-manipulation px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-sm text-gray-800"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("webAdmin.faq.answer")} (ES)
                      </label>
                      <TranslateButton
                        value={item.answer.es}
                        direction="es→en"
                        onTranslated={(v) =>
                          updateField(item.id, "answer", "en", v)
                        }
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={item.answer.es}
                      onChange={(e) =>
                        updateField(item.id, "answer", "es", e.target.value)
                      }
                      placeholder={t("webAdmin.faq.answerPlaceholderEs")}
                      className="w-full touch-manipulation px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-sm text-gray-800"
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

export default FaqTab;
