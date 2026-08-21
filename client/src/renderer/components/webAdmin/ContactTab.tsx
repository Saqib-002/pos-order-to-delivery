import React, { useState, useEffect } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { LocalisedString } from "./HeroTab";
import { Phone, Mail, MapPin, Compass, FileText } from "lucide-react";

export interface ContactContent {
  title: LocalisedString;
  phone: string;
  email: string;
  address: string;
  mapEmbedUrl: string;
}

const EMPTY_CONTACT: ContactContent = {
  title: {
    en: "",
    es: "",
  },
  phone: "",
  email: "",
  address: "",
  mapEmbedUrl: "",
};

function extractEmbedSrc(raw: string): string {
  if (!raw) return "";
  const match = raw.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : raw.trim();
}

interface ContactTabProps {
  initialContent?: ContactContent;
  onSaveSuccess?: () => void;
}

export const ContactTab: React.FC<ContactTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const [content, setContent] = useState<ContactContent>(EMPTY_CONTACT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialContent) {
      setContent({
        ...EMPTY_CONTACT,
        ...initialContent,
        title: {
          en: initialContent.title?.en || "",
          es: initialContent.title?.es || "",
        },
      });
    }
  }, [initialContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const res = await (window as any).electronAPI.saveSiteContent(
          token,
          "contact",
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

  const mapSrc = extractEmbedSrc(content.mapEmbedUrl);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6 max-w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">
            {t("webAdmin.contact.title")}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("webAdmin.contact.subtitle")}
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
          name="contactPageTitleEn"
          label={`${t("webAdmin.contact.pageTitle")} (${t("webAdmin.common.english")})`}
          preLabel={<FileText className="size-4 text-gray-500 mt-1" />}
          inputClasses="pl-9"
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
          placeholder={t("webAdmin.contact.pageTitlePlaceholderEn")}
          onChange={(e) =>
            setContent({
              ...content,
              title: { ...content.title, en: e.target.value },
            })
          }
        />
        <CustomInput
          type="text"
          name="contactPageTitleEs"
          label={`${t("webAdmin.contact.pageTitle")} (${t("webAdmin.common.espanol")})`}
          preLabel={<FileText className="size-4 text-gray-500 mt-1" />}
          inputClasses="pl-9"
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
          placeholder={t("webAdmin.contact.pageTitlePlaceholderEs")}
          onChange={(e) =>
            setContent({
              ...content,
              title: { ...content.title, es: e.target.value },
            })
          }
        />
      </div>

      {/* Phone & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomInput
          type="text"
          name="contactPhone"
          label={t("webAdmin.contact.phone")}
          preLabel={<Phone className="size-4 text-gray-500 mt-1" />}
          inputClasses="pl-9"
          value={content.phone}
          placeholder={t("webAdmin.contact.phonePlaceholder")}
          onChange={(e) =>
            setContent({ ...content, phone: e.target.value })
          }
        />
        <CustomInput
          type="email"
          name="contactEmail"
          label={t("webAdmin.contact.email")}
          preLabel={<Mail className="size-4 text-gray-500 mt-1" />}
          inputClasses="pl-9"
          value={content.email}
          placeholder={t("webAdmin.contact.emailPlaceholder")}
          onChange={(e) =>
            setContent({ ...content, email: e.target.value })
          }
        />
      </div>

      {/* Address */}
      <CustomInput
        type="text"
        name="contactAddress"
        label={t("webAdmin.contact.address")}
        preLabel={<MapPin className="size-4 text-gray-500 mt-1" />}
        inputClasses="pl-9"
        value={content.address}
        placeholder={t("webAdmin.contact.addressPlaceholder")}
        onChange={(e) =>
          setContent({ ...content, address: e.target.value })
        }
      />

      {/* Maps Embed URL */}
      <div className="space-y-3">
        <CustomInput
          type="text"
          name="contactMapEmbedUrl"
          label={t("webAdmin.contact.mapEmbed")}
          preLabel={<Compass className="size-4 text-gray-500 mt-1" />}
          inputClasses="pl-9"
          value={content.mapEmbedUrl}
          placeholder={t("webAdmin.contact.mapEmbedPlaceholder")}
          onChange={(e) =>
            setContent({ ...content, mapEmbedUrl: e.target.value })
          }
        />

        {/* Live Interactive Map Preview */}
        {mapSrc ? (
          <div className="rounded-xl overflow-hidden border border-gray-300 shadow-2xs bg-gray-50">
            <iframe
              src={mapSrc}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Map Preview"
            />
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50 flex flex-col items-center justify-center gap-2">
            <MapPin className="w-8 h-8 text-gray-400" />
            <p className="text-xs text-gray-500">
              {t("webAdmin.contact.noMapPreview", "Introduce una URL de Google Maps embed para previsualizar el mapa interactivo.")}
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
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

export default ContactTab;
