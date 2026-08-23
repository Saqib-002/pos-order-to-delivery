import React, { useState, useEffect, useRef } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { formatImageUrl } from "../../utils/imageUrl";
import {
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

export interface LocalisedString {
  en: string;
  es: string;
}

export interface HeroSlide {
  id: string;
  number: string;
  name: LocalisedString;
  image: string;
  visible: boolean;
}

export interface HeroContent {
  headingLine1: LocalisedString;
  headingLine2: LocalisedString;
  subheading: LocalisedString;
  ctaLabel: LocalisedString;
  ctaHref: string;
  slides?: HeroSlide[];
}

const EMPTY_HERO: HeroContent = {
  headingLine1: { en: "", es: "" },
  headingLine2: { en: "", es: "" },
  subheading: { en: "", es: "" },
  ctaLabel: { en: "", es: "" },
  ctaHref: "",
  slides: [],
};

interface HeroTabProps {
  initialContent?: HeroContent;
  onSaveSuccess?: () => void;
}

export const HeroTab: React.FC<HeroTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const [content, setContent] = useState<HeroContent>(EMPTY_HERO);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [saving, setSaving] = useState(false);
  const envBaseUrl =
    (import.meta as any).env?.VITE_DRIVER_API_URL?.replace(/\/api\/?$/, "") ||
    "https://api.alikebabrivas.es";
  const [driverApiUrl, setDriverApiUrl] = useState<string>(envBaseUrl);

  // Modal for add / edit slide
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideForm, setSlideForm] = useState<{
    name: LocalisedString;
    image: string;
  }>({
    name: { en: "", es: "" },
    image: "",
  });
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
      const { slides: s, ...rest } = initialContent;
      setContent({ ...EMPTY_HERO, ...rest });
      if (Array.isArray(s)) setSlides(s);
    }
  }, [initialContent]);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const payload = {
          ...content,
          slides,
        };
        const res = await (window as any).electronAPI.saveSiteContent(
          token,
          "hero",
          payload
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

  const openAddSlide = () => {
    setEditingSlideId(null);
    setSlideForm({ name: { en: "", es: "" }, image: "" });
    setModalOpen(true);
  };

  const openEditSlide = (slide: HeroSlide) => {
    setEditingSlideId(slide.id);
    setSlideForm({ name: { ...slide.name }, image: slide.image });
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSlideForm((prev) => ({ ...prev, image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveModalImage = () => {
    setSlideForm((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveSlideModal = () => {
    if (!slideForm.name.en.trim() && !slideForm.name.es.trim()) {
      toast.error(t("webAdmin.hero.dishNameEn") + " required");
      return;
    }

    if (editingSlideId) {
      setSlides(
        slides.map((s) =>
          s.id === editingSlideId
            ? {
              ...s,
              name: {
                en: slideForm.name.en || slideForm.name.es,
                es: slideForm.name.es || slideForm.name.en,
              },
              image: slideForm.image,
            }
            : s
        )
      );
    } else {
      const newSlide: HeroSlide = {
        id: `slide-${Date.now()}`,
        number: String(slides.length + 1).padStart(2, "0"),
        name: {
          en: slideForm.name.en || slideForm.name.es,
          es: slideForm.name.es || slideForm.name.en,
        },
        image: slideForm.image,
        visible: true,
      };
      setSlides([...slides, newSlide]);
    }
    setModalOpen(false);
  };

  const handleDeleteSlide = (id: string) => {
    setSlides(slides.filter((s) => s.id !== id));
  };

  const handleToggleVisible = (id: string) => {
    setSlides(
      slides.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* ── Headlines & Copy Section ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {t("webAdmin.hero.title")}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.hero.subtitle")}
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

        {/* Heading Line 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            type="text"
            name="headingLine1En"
            label={`${t("webAdmin.hero.headingLine1")} (EN)`}
            labelAction={
              <TranslateButton
                value={content.headingLine1.en}
                direction="en→es"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    headingLine1: { ...content.headingLine1, es: v },
                  })
                }
              />
            }
            value={content.headingLine1.en}
            placeholder={t("webAdmin.hero.headingLine1PlaceholderEn")}
            onChange={(e) =>
              setContent({
                ...content,
                headingLine1: { ...content.headingLine1, en: e.target.value },
              })
            }
          />
          <CustomInput
            type="text"
            name="headingLine1Es"
            label={`${t("webAdmin.hero.headingLine1")} (ES)`}
            labelAction={
              <TranslateButton
                value={content.headingLine1.es}
                direction="es→en"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    headingLine1: { ...content.headingLine1, en: v },
                  })
                }
              />
            }
            value={content.headingLine1.es}
            placeholder={t("webAdmin.hero.headingLine1PlaceholderEs")}
            onChange={(e) =>
              setContent({
                ...content,
                headingLine1: { ...content.headingLine1, es: e.target.value },
              })
            }
          />
        </div>

        {/* Heading Line 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            type="text"
            name="headingLine2En"
            label={`${t("webAdmin.hero.headingLine2")} (EN)`}
            labelAction={
              <TranslateButton
                value={content.headingLine2.en}
                direction="en→es"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    headingLine2: { ...content.headingLine2, es: v },
                  })
                }
              />
            }
            value={content.headingLine2.en}
            placeholder={t("webAdmin.hero.headingLine2PlaceholderEn", "TASTE.")}
            onChange={(e) =>
              setContent({
                ...content,
                headingLine2: { ...content.headingLine2, en: e.target.value },
              })
            }
          />
          <CustomInput
            type="text"
            name="headingLine2Es"
            label={`${t("webAdmin.hero.headingLine2")} (ES)`}
            labelAction={
              <TranslateButton
                value={content.headingLine2.es}
                direction="es→en"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    headingLine2: { ...content.headingLine2, en: v },
                  })
                }
              />
            }
            value={content.headingLine2.es}
            placeholder={t("webAdmin.hero.headingLine2PlaceholderEs", "DISTINGUIDO.")}
            onChange={(e) =>
              setContent({
                ...content,
                headingLine2: { ...content.headingLine2, es: e.target.value },
              })
            }
          />
        </div>

        {/* Subheading */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("webAdmin.hero.subheading")} (EN)
              </label>
              <TranslateButton
                value={content.subheading.en}
                direction="en→es"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    subheading: { ...content.subheading, es: v },
                  })
                }
              />
            </div>
            <textarea
              rows={3}
              value={content.subheading.en}
              onChange={(e) =>
                setContent({
                  ...content,
                  subheading: { ...content.subheading, en: e.target.value },
                })
              }
              placeholder={t("webAdmin.hero.subheadingPlaceholderEn")}
              className="w-full touch-manipulation px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-sm text-gray-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("webAdmin.hero.subheading")} (ES)
              </label>
              <TranslateButton
                value={content.subheading.es}
                direction="es→en"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    subheading: { ...content.subheading, en: v },
                  })
                }
              />
            </div>
            <textarea
              rows={3}
              value={content.subheading.es}
              onChange={(e) =>
                setContent({
                  ...content,
                  subheading: { ...content.subheading, es: e.target.value },
                })
              }
              placeholder={t("webAdmin.hero.subheadingPlaceholderEs")}
              className="w-full touch-manipulation px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-sm text-gray-800"
            />
          </div>
        </div>

        {/* CTA Label & Link */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CustomInput
            type="text"
            name="ctaLabelEn"
            label={`${t("webAdmin.hero.ctaLabel")} (EN)`}
            labelAction={
              <TranslateButton
                value={content.ctaLabel.en}
                direction="en→es"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    ctaLabel: { ...content.ctaLabel, es: v },
                  })
                }
              />
            }
            value={content.ctaLabel.en}
            placeholder={t("webAdmin.hero.ctaLabelPlaceholderEn")}
            onChange={(e) =>
              setContent({
                ...content,
                ctaLabel: { ...content.ctaLabel, en: e.target.value },
              })
            }
          />
          <CustomInput
            type="text"
            name="ctaLabelEs"
            label={`${t("webAdmin.hero.ctaLabel")} (ES)`}
            labelAction={
              <TranslateButton
                value={content.ctaLabel.es}
                direction="es→en"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    ctaLabel: { ...content.ctaLabel, en: v },
                  })
                }
              />
            }
            value={content.ctaLabel.es}
            placeholder={t("webAdmin.hero.ctaLabelPlaceholderEs")}
            onChange={(e) =>
              setContent({
                ...content,
                ctaLabel: { ...content.ctaLabel, es: e.target.value },
              })
            }
          />
          <CustomInput
            type="text"
            name="ctaHref"
            label={t("webAdmin.hero.ctaHref")}
            value={content.ctaHref}
            placeholder={t("webAdmin.hero.ctaHrefPlaceholder")}
            onChange={(e) =>
              setContent({ ...content, ctaHref: e.target.value })
            }
          />
        </div>
      </div>

      {/* ── Featured Slides Section ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {t("webAdmin.hero.slidesTitle")} ({slides.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.hero.slidesSubtitle")}
            </p>
          </div>
          <CustomButton
            type="button"
            variant="secondary"
            onClick={openAddSlide}
            label={t("webAdmin.hero.addSlide")}
          />
        </div>

        {slides.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-3">{t("webAdmin.hero.noSlides")}</p>
            <CustomButton
              type="button"
              variant="secondary"
              onClick={openAddSlide}
              label={t("webAdmin.hero.addSlide")}
              className="mx-auto"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slides.map((slide, idx) => {
              const displaySrc = formatImageUrl(slide.image, driverApiUrl);
              return (
                <div
                  key={slide.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
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
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-500">
                            #{idx + 1}
                          </span>
                          <h4 className="text-xs font-bold text-gray-900">
                            {slide.name.es || slide.name.en}
                          </h4>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {slide.name.en}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleVisible(slide.id)}
                        className={`p-1 rounded text-xs transition-colors cursor-pointer ${slide.visible
                            ? "text-emerald-600 hover:bg-emerald-50"
                            : "text-gray-400 hover:bg-gray-200"
                          }`}
                        title={slide.visible ? t("webAdmin.hero.visible") : t("webAdmin.hero.hidden")}
                      >
                        {slide.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditSlide(slide)}
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded text-xs transition-colors cursor-pointer"
                        title={t("webAdmin.common.edit")}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded text-xs transition-colors cursor-pointer"
                        title={t("webAdmin.common.delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <CustomButton
          type="button"
          variant="primary"
          onClick={handleSaveAll}
          isLoading={saving}
          label={
            saving ? t("webAdmin.actions.saving") : t("webAdmin.actions.save")
          }
        />
      </div>

      {/* Add / Edit Slide Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-800">
              {editingSlideId
                ? t("webAdmin.hero.modalEditTitle")
                : t("webAdmin.hero.modalAddTitle")}
            </h3>

            <div className="space-y-4">
              <CustomInput
                type="text"
                name="slideNameEn"
                label={t("webAdmin.hero.dishNameEn")}
                labelAction={
                  <TranslateButton
                    value={slideForm.name.en}
                    direction="en→es"
                    onTranslated={(v) =>
                      setSlideForm({
                        ...slideForm,
                        name: { ...slideForm.name, es: v },
                      })
                    }
                  />
                }
                value={slideForm.name.en}
                placeholder={t("webAdmin.hero.dishNamePlaceholderEn")}
                onChange={(e) =>
                  setSlideForm({
                    ...slideForm,
                    name: { ...slideForm.name, en: e.target.value },
                  })
                }
              />

              <CustomInput
                type="text"
                name="slideNameEs"
                label={t("webAdmin.hero.dishNameEs")}
                labelAction={
                  <TranslateButton
                    value={slideForm.name.es}
                    direction="es→en"
                    onTranslated={(v) =>
                      setSlideForm({
                        ...slideForm,
                        name: { ...slideForm.name, en: v },
                      })
                    }
                  />
                }
                value={slideForm.name.es}
                placeholder={t("webAdmin.hero.dishNamePlaceholderEs")}
                onChange={(e) =>
                  setSlideForm({
                    ...slideForm,
                    name: { ...slideForm.name, es: e.target.value },
                  })
                }
              />

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("webAdmin.hero.imagePath", "Imagen")}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-20 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {slideForm.image ? (
                      <img
                        src={formatImageUrl(slideForm.image, driverApiUrl)}
                        alt="Slide preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t("webAdmin.about.uploadImage", "Subir Imagen")}</span>
                      </button>
                      {slideForm.image && (
                        <button
                          type="button"
                          onClick={handleRemoveModalImage}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{t("webAdmin.about.removeImage", "Eliminar")}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {t("webAdmin.about.imageHint", "PNG, JPG, WEBP")}
                    </p>
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
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                {t("webAdmin.common.cancel")}
              </button>
              <CustomButton
                type="button"
                variant="primary"
                onClick={handleSaveSlideModal}
                label={t("webAdmin.common.save")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroTab;
