import React, { useState, useEffect, useRef } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { RichTextEditor, blocknoteToPlainText, plainTextToBlocknote } from "./RichTextEditor";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { formatImageUrl } from "../../utils/imageUrl";
import { LocalisedString } from "./HeroTab";
import { Trash2, ImageIcon, Upload, X, Calendar } from "lucide-react";

export interface AboutMilestone {
  id: string;
  year: string;
  text: LocalisedString;
}

export interface AboutContent {
  title: LocalisedString;
  story: LocalisedString;
  imageUrl: string;
  milestones: AboutMilestone[];
}

const EMPTY_ABOUT: AboutContent = {
  title: {
    en: "",
    es: "",
  },
  story: {
    en: "",
    es: "",
  },
  imageUrl: "",
  milestones: [],
};

interface AboutTabProps {
  initialContent?: AboutContent;
  onSaveSuccess?: () => void;
}

export const AboutTab: React.FC<AboutTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const [content, setContent] = useState<AboutContent>(EMPTY_ABOUT);
  const [saving, setSaving] = useState(false);
  const envBaseUrl =
    (import.meta as any).env?.VITE_DRIVER_API_URL?.replace(/\/api\/?$/, "") ||
    "https://api.alikebabrivas.es";
  const [driverApiUrl, setDriverApiUrl] = useState<string>(envBaseUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        if ((window as any).electronAPI?.getDriverApiUrl) {
          const url = await (window as any).electronAPI.getDriverApiUrl();
          if (url) setDriverApiUrl(url);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (initialContent) {
      const getStoryStr = (val: any) => {
        if (!val) return "";
        if (typeof val === "string") return val;
        if (typeof val === "object") {
          try {
            return JSON.stringify(val);
          } catch {
            return "";
          }
        }
        return String(val);
      };

      setContent({
        title: {
          en: initialContent.title?.en || "",
          es: initialContent.title?.es || "",
        },
        story: {
          en: getStoryStr(initialContent.story?.en),
          es: getStoryStr(initialContent.story?.es),
        },
        imageUrl: initialContent.imageUrl || (initialContent as any).image || "",
        milestones: Array.isArray(initialContent.milestones)
          ? initialContent.milestones.map((m) => ({
              id: m.id || `milestone-${Date.now()}-${Math.random()}`,
              year: m.year || "",
              text: { en: m.text?.en || "", es: m.text?.es || "" },
            }))
          : [],
      });
    }
  }, [initialContent]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setContent((prev) => ({ ...prev, imageUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setContent((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addMilestone = () => {
    const id = `milestone-${Date.now()}`;
    setContent((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          id,
          year: new Date().getFullYear().toString(),
          text: { en: "", es: "" },
        },
      ],
    }));
  };

  const updateMilestone = (
    id: string,
    field: "year" | "text",
    val: string | { en?: string; es?: string }
  ) => {
    setContent((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) => {
        if (m.id !== id) return m;
        if (field === "year") return { ...m, year: val as string };
        return { ...m, text: { ...m.text, ...(val as any) } };
      }),
    }));
  };

  const removeMilestone = (id: string) => {
    setContent((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const res = await (window as any).electronAPI.saveSiteContent(
          token,
          "about",
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

  const rawImg = content.imageUrl || (content as any).image || "";
  const displayImageSrc = formatImageUrl(rawImg, driverApiUrl);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-full">
      {/* Title & Page Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {t("webAdmin.about.title")}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.about.subtitle")}
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

        {/* Page Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            type="text"
            name="aboutPageTitleEn"
            label={`${t("webAdmin.about.pageTitle")} (EN)`}
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
            placeholder={t("webAdmin.about.pageTitlePlaceholderEn")}
            onChange={(e) =>
              setContent({
                ...content,
                title: { ...content.title, en: e.target.value },
              })
            }
          />
          <CustomInput
            type="text"
            name="aboutPageTitleEs"
            label={`${t("webAdmin.about.pageTitle")} (ES)`}
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
            placeholder={t("webAdmin.about.pageTitlePlaceholderEs")}
            onChange={(e) =>
              setContent({
                ...content,
                title: { ...content.title, es: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* Featured Image Section (Upload Only, No URL Input) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-base font-bold text-gray-800">
            {t("webAdmin.about.imageTitle")}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("webAdmin.about.imageSubtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-shrink-0 w-36 h-28 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
            {displayImageSrc ? (
              <img
                src={displayImageSrc}
                alt="About featured"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t("webAdmin.about.uploadImage")}</span>
              </button>
              {content.imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-3.5 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t("webAdmin.about.removeImage")}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">{t("webAdmin.about.imageHint")}</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Story Section with RichTextEditor */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-base font-bold text-gray-800">
            {t("webAdmin.about.storyTitle")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RichTextEditor
            label={`${t("webAdmin.about.storyTitle")} (EN)`}
            labelAction={
              <TranslateButton
                value={blocknoteToPlainText(content.story.en)}
                direction="en→es"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    story: { ...content.story, es: plainTextToBlocknote(v) },
                  })
                }
              />
            }
            value={content.story.en}
            onChange={(val) =>
              setContent({
                ...content,
                story: { ...content.story, en: val },
              })
            }
            minHeight="150px"
          />
          <RichTextEditor
            label={`${t("webAdmin.about.storyTitle")} (ES)`}
            labelAction={
              <TranslateButton
                value={blocknoteToPlainText(content.story.es)}
                direction="es→en"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    story: { ...content.story, en: plainTextToBlocknote(v) },
                  })
                }
              />
            }
            value={content.story.es}
            onChange={(val) =>
              setContent({
                ...content,
                story: { ...content.story, es: val },
              })
            }
            minHeight="150px"
          />
        </div>
      </div>

      {/* Milestones Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {t("webAdmin.about.milestonesTitle")} ({content.milestones.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.about.milestonesSubtitle")}
            </p>
          </div>
          <CustomButton
            type="button"
            variant="secondary"
            onClick={addMilestone}
            label={t("webAdmin.about.addMilestone")}
          />
        </div>

        {content.milestones.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-3">{t("webAdmin.about.noMilestones")}</p>
            <CustomButton
              type="button"
              variant="secondary"
              onClick={addMilestone}
              label={t("webAdmin.about.addMilestone")}
              className="mx-auto"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {content.milestones.map((m, idx) => (
              <div
                key={m.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">
                      #{idx + 1}
                    </span>
                    <CustomInput
                      type="text"
                      name={`milestoneYear_${m.id}`}
                      value={m.year}
                      placeholder={t("webAdmin.about.yearPlaceholder")}
                      onChange={(e) =>
                        updateMilestone(m.id, "year", e.target.value)
                      }
                      inputClasses="w-28 font-bold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMilestone(m.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("webAdmin.common.delete")}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("webAdmin.about.description")} (EN)
                      </label>
                      <TranslateButton
                        value={m.text.en}
                        direction="en→es"
                        onTranslated={(v) =>
                          updateMilestone(m.id, "text", { es: v })
                        }
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={m.text.en}
                      onChange={(e) =>
                        updateMilestone(m.id, "text", { en: e.target.value })
                      }
                      placeholder={t("webAdmin.about.descriptionPlaceholderEn")}
                      className="w-full touch-manipulation px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-xs text-gray-800"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("webAdmin.about.description")} (ES)
                      </label>
                      <TranslateButton
                        value={m.text.es}
                        direction="es→en"
                        onTranslated={(v) =>
                          updateMilestone(m.id, "text", { en: v })
                        }
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={m.text.es}
                      onChange={(e) =>
                        updateMilestone(m.id, "text", { es: e.target.value })
                      }
                      placeholder={t("webAdmin.about.descriptionPlaceholderEs")}
                      className="w-full touch-manipulation px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-xs text-gray-800"
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

export default AboutTab;
