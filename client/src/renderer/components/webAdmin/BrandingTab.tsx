import React, { useState, useEffect, useRef } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { RichTextEditor, blocknoteToPlainText, plainTextToBlocknote } from "./RichTextEditor";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { formatImageUrl } from "../../utils/imageUrl";
import { compressImageFile, fileToBase64, type CompressInfo } from "../../utils/imageCompression";
import { ImageAspectHint } from "../shared/ImageAspectHint";
import { LocalisedString } from "./HeroTab";
import { ImageIcon, Upload, X, Clock, Palette, Loader2, Fullscreen } from "lucide-react";
import ImagePreviewModal from "../shared/ImagePreviewModal";

export interface BrandingData {
  logoUrl: string;
  brandName: string;
  brandSubtext: string;
  openingHours: LocalisedString;
}

export interface AnnouncementData {
  enabled: boolean;
  text: LocalisedString;
}

export interface SystemData {
  responseTime: LocalisedString;
}

export interface BrandingContent {
  branding?: BrandingData;
  announcement?: AnnouncementData;
  system?: SystemData;
}

const EMPTY_BRANDING: BrandingData = {
  logoUrl: "",
  brandName: "",
  brandSubtext: "",
  openingHours: { en: "", es: "" },
};

interface BrandingTabProps {
  initialContent?: any;
  onSaveSuccess?: () => void;
}

export const BrandingTab: React.FC<BrandingTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const [branding, setBranding] = useState<BrandingData>(EMPTY_BRANDING);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressInfo, setCompressInfo] = useState<CompressInfo | null>(null);
  const [logoPreviewOpen, setLogoPreviewOpen] = useState(false);
  const envBaseUrl =
    (import.meta as any).env?.VITE_DRIVER_API_URL?.replace(/\/api\/?$/, "") ||
    "";
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
      const b = initialContent.branding || initialContent;
      if (b.brandName !== undefined || b.logoUrl !== undefined) {
        setBranding({
          logoUrl: b.logoUrl || "",
          brandName: b.brandName || "",
          brandSubtext: b.brandSubtext || "",
          openingHours: {
            en: b.openingHours?.en || "",
            es: b.openingHours?.es || "",
          },
        });
      }
    }
  }, [initialContent]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setCompressing(true);
    setCompressInfo(null);
    setBranding((prev) => ({ ...prev, logoUrl: "" }));

    try {
      const { outputFile, compressInfo: info } = await compressImageFile(file);
      const base64 = await fileToBase64(outputFile);
      setBranding((prev) => ({ ...prev, logoUrl: base64 }));
      setCompressInfo(info);
    } catch {
      // Fallback: raw file as base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveLogo = () => {
    setBranding((prev) => ({ ...prev, logoUrl: "" }));
    setCompressInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const res = await (window as any).electronAPI.saveSiteContent(
          token,
          "branding",
          branding
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

  const displayLogoSrc = formatImageUrl(branding.logoUrl, driverApiUrl);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-full">
      {/* ── Brand Identity Card ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Palette className="w-4 h-4 text-gray-500" />
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {t("webAdmin.branding.title")}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("webAdmin.branding.subtitle")}
            </p>
          </div>
        </div>

        {/* Logo Section */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div
            className={`w-28 h-28 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative${displayLogoSrc && !compressing ? " cursor-pointer group" : ""}`}
            onClick={() => displayLogoSrc && !compressing && setLogoPreviewOpen(true)}
          >
            {compressing ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : displayLogoSrc ? (
              <>
                <img
                  src={displayLogoSrc}
                  alt="Brand logo"
                  className="w-full h-full object-contain p-2"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <Fullscreen className="w-5 h-5 text-white" />
                </div>
              </>
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <h4 className="text-xs font-bold text-gray-800">
                {t("webAdmin.branding.logoTitle")}
              </h4>
              <p className="text-[11px] text-gray-500">
                {t("webAdmin.branding.logoSubtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {compressing
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Upload className="w-3.5 h-3.5" />}
                <span>
                  {compressing
                    ? t("common.compressing", "Comprimiendo…")
                    : t("webAdmin.branding.uploadLogo")}
                </span>
              </button>
              {branding.logoUrl && !compressing && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3.5 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t("webAdmin.branding.removeLogo")}</span>
                </button>
              )}
              {displayLogoSrc && !compressing && (
                <button
                  type="button"
                  onClick={() => setLogoPreviewOpen(true)}
                  className="px-3.5 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Fullscreen className="w-3.5 h-3.5" />
                  <span>{t("common.preview")}</span>
                </button>
              )}
            </div>
            <ImageAspectHint ratio="1:1" width={512} height={512} />
            {!branding.logoUrl && !compressing && (
              <p className="text-[11px] text-gray-400 italic">
                {t("webAdmin.branding.noLogo")}
              </p>
            )}
            {compressInfo && (
              <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5 flex-wrap">
                <span>
                  {(compressInfo.original / 1024).toFixed(0)} KB → {(compressInfo.compressed / 1024).toFixed(0)} KB
                </span>
                <span className="text-gray-400 font-normal">
                  ({Math.round((1 - compressInfo.compressed / compressInfo.original) * 100)}% {t("common.compressed", "comprimido")})
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
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Brand Name & Tagline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <CustomInput
            type="text"
            name="brandName"
            label={t("webAdmin.branding.brandName")}
            value={branding.brandName}
            placeholder={t("webAdmin.branding.brandNamePlaceholder")}
            onChange={(e) =>
              setBranding({ ...branding, brandName: e.target.value })
            }
          />
          <CustomInput
            type="text"
            name="brandSubtext"
            label={t("webAdmin.branding.brandSubtext")}
            value={branding.brandSubtext}
            placeholder={t("webAdmin.branding.brandSubtextPlaceholder")}
            onChange={(e) =>
              setBranding({ ...branding, brandSubtext: e.target.value })
            }
          />
        </div>
      </div>

      {/* ── Opening Hours Card (Rich Text) ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {t("webAdmin.branding.hoursTitle")}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("webAdmin.branding.hoursSubtitle")}
              </p>
            </div>
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
          <RichTextEditor
            label={`${t("webAdmin.branding.hoursTitle")} (EN)`}
            labelAction={
              <TranslateButton
                value={blocknoteToPlainText(branding.openingHours.en)}
                direction="en→es"
                onTranslated={(v) =>
                  setBranding({
                    ...branding,
                    openingHours: {
                      ...branding.openingHours,
                      es: plainTextToBlocknote(v),
                    },
                  })
                }
              />
            }
            value={branding.openingHours.en}
            onChange={(val) =>
              setBranding({
                ...branding,
                openingHours: { ...branding.openingHours, en: val },
              })
            }
            hint={t("webAdmin.branding.hoursHint")}
            minHeight="140px"
          />
          <RichTextEditor
            label={`${t("webAdmin.branding.hoursTitle")} (ES)`}
            labelAction={
              <TranslateButton
                value={blocknoteToPlainText(branding.openingHours.es)}
                direction="es→en"
                onTranslated={(v) =>
                  setBranding({
                    ...branding,
                    openingHours: {
                      ...branding.openingHours,
                      en: plainTextToBlocknote(v),
                    },
                  })
                }
              />
            }
            value={branding.openingHours.es}
            onChange={(val) =>
              setBranding({
                ...branding,
                openingHours: { ...branding.openingHours, es: val },
              })
            }
            hint={t("webAdmin.branding.hoursHint")}
            minHeight="140px"
          />
        </div>
      </div>

      {/* Save Button */}
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

      {logoPreviewOpen && displayLogoSrc && (
        <ImagePreviewModal
          src={displayLogoSrc}
          alt="Brand logo"
          onClose={() => setLogoPreviewOpen(false)}
        />
      )}
    </form>
  );
};

export default BrandingTab;
