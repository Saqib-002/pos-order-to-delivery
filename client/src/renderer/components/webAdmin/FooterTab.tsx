import React, { useState, useEffect } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { IconPicker } from "./IconPicker";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { LocalisedString } from "./HeroTab";
import { XTwitterIcon } from "@/renderer/public/Svg";
import {
  Instagram,
  Facebook,
  Phone,
  Clock,
  Award,
} from "lucide-react";

export interface FooterIcons {
  hours?: string;
  qualityBadge?: string;
  location?: string;
  phone?: string;
  email?: string;
}

export interface FooterContent {
  description: LocalisedString;
  hours: LocalisedString;
  qualityTitle: LocalisedString;
  qualityBadge: LocalisedString;
  copyright: string;
  icons?: FooterIcons;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    whatsapp?: string;
  };
}

const DEFAULT_FOOTER_ICONS: FooterIcons = {
  hours: "Clock",
  qualityBadge: "Award",
  location: "MapPin",
  phone: "Phone",
  email: "Mail",
};

const EMPTY_FOOTER: FooterContent = {
  description: {
    en: "",
    es: "",
  },
  hours: {
    en: "",
    es: "",
  },
  qualityTitle: {
    en: "",
    es: "",
  },
  qualityBadge: {
    en: "",
    es: "",
  },
  copyright: "",
  icons: DEFAULT_FOOTER_ICONS,
  socialLinks: {
    instagram: "",
    facebook: "",
    twitter: "",
    whatsapp: "",
  },
};

interface FooterTabProps {
  initialContent?: FooterContent;
  onSaveSuccess?: () => void;
}

export const FooterTab: React.FC<FooterTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const [content, setContent] = useState<FooterContent>(EMPTY_FOOTER);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialContent) {
      setContent({
        ...EMPTY_FOOTER,
        ...initialContent,
        icons: {
          ...DEFAULT_FOOTER_ICONS,
          ...(initialContent.icons || {}),
        },
        socialLinks: {
          ...EMPTY_FOOTER.socialLinks,
          ...(initialContent.socialLinks || {}),
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
          "footer",
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

  const setIcon = (key: keyof FooterIcons, name: string) => {
    setContent((prev) => ({
      ...prev,
      icons: {
        ...(prev.icons || DEFAULT_FOOTER_ICONS),
        [key]: name,
      },
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6 max-w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">
            {t("webAdmin.footer.title")}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("webAdmin.footer.subtitle")}
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

      {/* Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-700">
              {t("webAdmin.footer.description")} ({t("webAdmin.common.english")})
            </label>
            <TranslateButton
              value={content.description.en}
              direction="en→es"
              onTranslated={(v) =>
                setContent({
                  ...content,
                  description: { ...content.description, es: v },
                })
              }
            />
          </div>
          <textarea
            rows={3}
            value={content.description.en}
            onChange={(e) =>
              setContent({
                ...content,
                description: { ...content.description, en: e.target.value },
              })
            }
            placeholder={t("webAdmin.footer.descriptionPlaceholderEn")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-xs text-gray-800"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-700">
              {t("webAdmin.footer.description")} ({t("webAdmin.common.espanol")})
            </label>
            <TranslateButton
              value={content.description.es}
              direction="es→en"
              onTranslated={(v) =>
                setContent({
                  ...content,
                  description: { ...content.description, en: v },
                })
              }
            />
          </div>
          <textarea
            rows={3}
            value={content.description.es}
            onChange={(e) =>
              setContent({
                ...content,
                description: { ...content.description, es: e.target.value },
              })
            }
            placeholder={t("webAdmin.footer.descriptionPlaceholderEs")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none text-xs text-gray-800"
          />
        </div>
      </div>

      {/* Opening Hours & Hours Icon */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            type="text"
            name="footerHoursEn"
            label={`${t("webAdmin.footer.hours")} (${t("webAdmin.common.english")})`}
            labelAction={
              <TranslateButton
                value={content.hours.en}
                direction="en→es"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    hours: { ...content.hours, es: v },
                  })
                }
              />
            }
            value={content.hours.en}
            placeholder={t("webAdmin.footer.hoursPlaceholderEn")}
            onChange={(e) =>
              setContent({
                ...content,
                hours: { ...content.hours, en: e.target.value },
              })
            }
          />
          <CustomInput
            type="text"
            name="footerHoursEs"
            label={`${t("webAdmin.footer.hours")} (${t("webAdmin.common.espanol")})`}
            labelAction={
              <TranslateButton
                value={content.hours.es}
                direction="es→en"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    hours: { ...content.hours, en: v },
                  })
                }
              />
            }
            value={content.hours.es}
            placeholder={t("webAdmin.footer.hoursPlaceholderEs")}
            onChange={(e) =>
              setContent({
                ...content,
                hours: { ...content.hours, es: e.target.value },
              })
            }
          />
        </div>

        <div className="w-[50%] pr-2">
          <IconPicker
            label="Hours Icon"
            value={content.icons?.hours || "Clock"}
            onChange={(name) => setIcon("hours", name)}
          />
        </div>
      </div>

      {/* Quality Badge & Title & Icon */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            type="text"
            name="qualityTitleEn"
            label={`${t("webAdmin.footer.qualityTitle")} (${t("webAdmin.common.english")})`}
            labelAction={
              <TranslateButton
                value={content.qualityTitle.en}
                direction="en→es"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    qualityTitle: { ...content.qualityTitle, es: v },
                  })
                }
              />
            }
            value={content.qualityTitle.en}
            placeholder={t("webAdmin.footer.qualityTitlePlaceholderEn")}
            onChange={(e) =>
              setContent({
                ...content,
                qualityTitle: {
                  ...content.qualityTitle,
                  en: e.target.value,
                },
              })
            }
          />
          <CustomInput
            type="text"
            name="qualityTitleEs"
            label={`${t("webAdmin.footer.qualityTitle")} (${t("webAdmin.common.espanol")})`}
            labelAction={
              <TranslateButton
                value={content.qualityTitle.es}
                direction="es→en"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    qualityTitle: {
                      ...content.qualityTitle,
                      en: v,
                    },
                  })
                }
              />
            }
            value={content.qualityTitle.es}
            placeholder={t("webAdmin.footer.qualityTitlePlaceholderEs")}
            onChange={(e) =>
              setContent({
                ...content,
                qualityTitle: {
                  ...content.qualityTitle,
                  es: e.target.value,
                },
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            type="text"
            name="qualityBadgeEn"
            label={`${t("webAdmin.footer.qualityBadge")} (${t("webAdmin.common.english")})`}
            labelAction={
              <TranslateButton
                value={content.qualityBadge.en}
                direction="en→es"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    qualityBadge: { ...content.qualityBadge, es: v },
                  })
                }
              />
            }
            value={content.qualityBadge.en}
            placeholder={t("webAdmin.footer.qualityBadgePlaceholderEn")}
            onChange={(e) =>
              setContent({
                ...content,
                qualityBadge: {
                  ...content.qualityBadge,
                  en: e.target.value,
                },
              })
            }
          />
          <CustomInput
            type="text"
            name="qualityBadgeEs"
            label={`${t("webAdmin.footer.qualityBadge")} (${t("webAdmin.common.espanol")})`}
            labelAction={
              <TranslateButton
                value={content.qualityBadge.es}
                direction="es→en"
                onTranslated={(v) =>
                  setContent({
                    ...content,
                    qualityBadge: {
                      ...content.qualityBadge,
                      en: v,
                    },
                  })
                }
              />
            }
            value={content.qualityBadge.es}
            placeholder={t("webAdmin.footer.qualityBadgePlaceholderEs")}
            onChange={(e) =>
              setContent({
                ...content,
                qualityBadge: {
                  ...content.qualityBadge,
                  es: e.target.value,
                },
              })
            }
          />
        </div>

        <div className="w-[50%] pr-2">
          <IconPicker
            label="Quality Badge Icon"
            value={content.icons?.qualityBadge || "Award"}
            onChange={(name) => setIcon("qualityBadge", name)}
          />
        </div>
      </div>

      {/* Copyright */}
      <CustomInput
        type="text"
        name="copyright"
        label={t("webAdmin.footer.copyright")}
        value={content.copyright}
        placeholder="© 2026 Alí Doner. All rights reserved."
        onChange={(e) =>
          setContent({ ...content, copyright: e.target.value })
        }
      />

      {/* Social Links with Respective Icons */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          {t("webAdmin.footer.socialTitle")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Instagram */}
          <CustomInput
            type="text"
            name="instagram"
            label={t("webAdmin.footer.instagram")}
            preLabel={<Instagram className="size-4 text-pink-600 mt-1" />}
            inputClasses="pl-9"
            value={content.socialLinks?.instagram || ""}
            placeholder="https://instagram.com/..."
            onChange={(e) =>
              setContent({
                ...content,
                socialLinks: {
                  ...content.socialLinks,
                  instagram: e.target.value,
                },
              })
            }
          />

          {/* Facebook */}
          <CustomInput
            type="text"
            name="facebook"
            label={t("webAdmin.footer.facebook")}
            preLabel={<Facebook className="size-4 text-blue-600 mt-1" />}
            inputClasses="pl-9"
            value={content.socialLinks?.facebook || ""}
            placeholder="https://facebook.com/..."
            onChange={(e) =>
              setContent({
                ...content,
                socialLinks: {
                  ...content.socialLinks,
                  facebook: e.target.value,
                },
              })
            }
          />

          {/* Twitter / X */}
          <CustomInput
            type="text"
            name="twitter"
            label={t("webAdmin.footer.twitter")}
            preLabel={<XTwitterIcon className="size-4 text-gray-900 mt-1" />}
            inputClasses="pl-9"
            value={content.socialLinks?.twitter || ""}
            placeholder="https://x.com/..."
            onChange={(e) =>
              setContent({
                ...content,
                socialLinks: {
                  ...content.socialLinks,
                  twitter: e.target.value,
                },
              })
            }
          />

          {/* WhatsApp */}
          <CustomInput
            type="text"
            name="whatsapp"
            label={t("webAdmin.footer.whatsapp")}
            preLabel={<Phone className="size-4 text-emerald-600 mt-1" />}
            inputClasses="pl-9"
            value={content.socialLinks?.whatsapp || ""}
            placeholder="+34 600 000 000"
            onChange={(e) =>
              setContent({
                ...content,
                socialLinks: {
                  ...content.socialLinks,
                  whatsapp: e.target.value,
                },
              })
            }
          />
        </div>
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

export default FooterTab;
