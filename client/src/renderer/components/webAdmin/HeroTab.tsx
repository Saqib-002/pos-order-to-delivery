import React, { useState, useEffect, useRef } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import SortableSlideCard from "./SortableSlideCard";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { formatImageUrl } from "../../utils/imageUrl";
import { compressImageFile, fileToBase64, type CompressInfo } from "../../utils/imageCompression";
import { ImageAspectHint } from "../shared/ImageAspectHint";
import ImagePreviewModal from "../shared/ImagePreviewModal";
import { Image as ImageIcon, Upload, X, Loader2, Fullscreen } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

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

/** Reassign the `number` field to match each slide's new position in the array */
const reassignNumbers = (slides: HeroSlide[]): HeroSlide[] =>
  slides.map((s, i) => ({ ...s, number: String(i + 1).padStart(2, "0") }));

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
    (import.meta as any).env?.VITE_DRIVER_API_URL?.replace(/\/api\/?$/, "") || "";
  const [driverApiUrl, setDriverApiUrl] = useState<string>(envBaseUrl);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideForm, setSlideForm] = useState<{ name: LocalisedString; image: string }>({
    name: { en: "", es: "" },
    image: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressInfo, setCompressInfo] = useState<CompressInfo | null>(null);
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false);

  // ── dnd-kit sensors ──────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Effects ──────────────────────────────────────────────────────────────
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

  // ── Drag end ─────────────────────────────────────────────────────────────
  const handleSlideDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSlides((current) => {
      const oldIndex = current.findIndex((s) => s.id === active.id);
      const newIndex = current.findIndex((s) => s.id === over.id);
      // Reassign `number` to keep schema consistent with new positions
      return reassignNumbers(arrayMove(current, oldIndex, newIndex));
    });
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const payload: HeroContent = { ...content, slides };
        const res = await (window as any).electronAPI.saveSiteContent(token, "hero", payload);
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

  // ── Slide CRUD ───────────────────────────────────────────────────────────
  const openAddSlide = () => {
    setEditingSlideId(null);
    setSlideForm({ name: { en: "", es: "" }, image: "" });
    setCompressInfo(null);
    setModalOpen(true);
  };

  const openEditSlide = (slide: HeroSlide) => {
    setEditingSlideId(slide.id);
    setSlideForm({ name: { ...slide.name }, image: slide.image });
    setCompressInfo(null);
    setModalOpen(true);
  };

  const handleDeleteSlide = (id: string) => {
    setSlides((current) => reassignNumbers(current.filter((s) => s.id !== id)));
  };

  const handleToggleVisible = (id: string) => {
    setSlides((current) =>
      current.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleSaveSlideModal = () => {
    if (editingSlideId) {
      setSlides((current) =>
        current.map((s) =>
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
      setSlides((current) => [...current, newSlide]);
    }
    setModalOpen(false);
  };

  // ── Image upload ─────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setCompressing(true);
    setCompressInfo(null);
    setSlideForm((prev) => ({ ...prev, image: "" }));

    try {
      const { outputFile, compressInfo: info } = await compressImageFile(file);
      const base64 = await fileToBase64(outputFile);
      setSlideForm((prev) => ({ ...prev, image: base64 }));
      setCompressInfo(info);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () =>
        setSlideForm((prev) => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveModalImage = () => {
    setSlideForm((prev) => ({ ...prev, image: "" }));
    setCompressInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-full">
      {/* ── CTA Section ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
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
                  setContent({ ...content, ctaLabel: { ...content.ctaLabel, es: v } })
                }
              />
            }
            value={content.ctaLabel.en}
            placeholder={t("webAdmin.hero.ctaLabelPlaceholderEn")}
            onChange={(e) =>
              setContent({ ...content, ctaLabel: { ...content.ctaLabel, en: e.target.value } })
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
                  setContent({ ...content, ctaLabel: { ...content.ctaLabel, en: v } })
                }
              />
            }
            value={content.ctaLabel.es}
            placeholder={t("webAdmin.hero.ctaLabelPlaceholderEs")}
            onChange={(e) =>
              setContent({ ...content, ctaLabel: { ...content.ctaLabel, es: e.target.value } })
            }
          />
          <CustomInput
            type="text"
            name="ctaHref"
            label={t("webAdmin.hero.ctaHref")}
            value={content.ctaHref}
            placeholder={t("webAdmin.hero.ctaHrefPlaceholder")}
            onChange={(e) => setContent({ ...content, ctaHref: e.target.value })}
          />
        </div>
      </div>

      {/* ── Slides Section ── */}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSlideDragEnd}
          >
            <SortableContext
              items={slides.map((s) => s.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slides.map((slide, idx) => (
                  <SortableSlideCard
                    key={slide.id}
                    slide={slide}
                    idx={idx}
                    driverApiUrl={driverApiUrl}
                    onToggleVisible={handleToggleVisible}
                    onEdit={openEditSlide}
                    onDelete={handleDeleteSlide}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* ── Save Button ── */}
      <div className="flex justify-end pt-2">
        <CustomButton
          type="button"
          variant="primary"
          onClick={handleSaveAll}
          isLoading={saving}
          label={saving ? t("webAdmin.actions.saving") : t("webAdmin.actions.save")}
        />
      </div>

      {/* ── Add / Edit Slide Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-800">
              {editingSlideId
                ? t("webAdmin.hero.modalEditTitle")
                : t("webAdmin.hero.modalAddTitle")}
            </h3>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("webAdmin.hero.imagePath", "Imagen")}
                </label>
                <div className="flex items-center gap-4">
                  {/* Thumbnail — click to preview if image exists */}
                  <div
                    className={`w-24 h-20 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 ${slideForm.image && !compressing ? "cursor-pointer group relative" : ""}`}
                    onClick={() => slideForm.image && !compressing && setModalPreviewOpen(true)}
                    title={slideForm.image && !compressing ? "Click to preview" : undefined}
                  >
                    {compressing ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : slideForm.image ? (
                      <>
                        <img
                          src={formatImageUrl(slideForm.image, driverApiUrl)}
                          alt="Slide preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <Fullscreen className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <ImageIcon className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={compressing}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {compressing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {compressing
                            ? t("common.compressing", "Comprimiendo…")
                            : t("webAdmin.about.uploadImage", "Subir Imagen")}
                        </span>
                      </button>
                      {slideForm.image && !compressing && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModalPreviewOpen(true)}
                            className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Fullscreen className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveModalImage}
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t("webAdmin.about.removeImage", "Eliminar")}</span>
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {t("webAdmin.about.imageHint", "PNG, JPG, WEBP")}
                    </p>
                    <ImageAspectHint ratio="2.1:1" width={1512} height={720} />
                    {compressInfo && (
                      <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5 flex-wrap">
                        <span>
                          {(compressInfo.original / 1024).toFixed(0)} KB →{" "}
                          {(compressInfo.compressed / 1024).toFixed(0)} KB
                        </span>
                        <span className="text-gray-400 font-normal">
                          (
                          {Math.round(
                            (1 - compressInfo.compressed / compressInfo.original) * 100
                          )}
                          % {t("common.compressed", "comprimido")})
                        </span>
                        {compressInfo.width && compressInfo.height && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600 border border-gray-200">
                            {compressInfo.width} × {compressInfo.height} px
                          </span>
                        )}
                      </p>
                    )}
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
                onClick={() => {
                  setModalOpen(false);
                  setCompressInfo(null);
                  setModalPreviewOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                {t("webAdmin.common.cancel")}
              </button>
              <CustomButton
                type="button"
                variant="primary"
                onClick={handleSaveSlideModal}
                disabled={compressing}
                label={t("webAdmin.common.save")}
              />
            </div>
          </div>
        </div>
      )}

      {/* Full-screen preview triggered from inside the add/edit modal */}
      {modalPreviewOpen && slideForm.image && (
        <ImagePreviewModal
          src={formatImageUrl(slideForm.image, driverApiUrl)}
          alt="Slide preview"
          onClose={() => setModalPreviewOpen(false)}
        />
      )}
    </div>
  );
};

export default HeroTab;
