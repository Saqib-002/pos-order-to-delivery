import React, { useState, useEffect } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { LocalisedString } from "./HeroTab";
import {
  ShieldAlert,
  KeyRound,
  Clock,
  FileText,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
} from "lucide-react";

export interface MaintenanceContent {
  enabledWeb: boolean;
  enabledMobile: boolean;
  /** Legacy single-flag kept for backward-compat when reading old stored data */
  enabled?: boolean;
  password?: string;
  staffPassword?: string;
  title: LocalisedString;
  message: LocalisedString;
  estimatedReturn?: string;
}

const EMPTY_MAINTENANCE: MaintenanceContent = {
  enabledWeb: false,
  enabledMobile: false,
  password: "",
  staffPassword: "",
  title: {
    en: "We'll Be Back Soon!",
    es: "¡Volveremos Pronto!",
  },
  message: {
    en: "We are performing scheduled maintenance to improve our online ordering service. Please check back shortly.",
    es: "Estamos realizando labores de mantenimiento programadas para mejorar nuestro servicio de pedidos online. Por favor, vuelve a intentarlo en unos minutos.",
  },
  estimatedReturn: "",
};

interface MaintenanceTabProps {
  initialContent?: MaintenanceContent;
  onSaveSuccess?: () => void;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const {
    auth: { token },
  } = useAuth();
  const [content, setContent] = useState<MaintenanceContent>(EMPTY_MAINTENANCE);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialContent) {
      const pass = initialContent.password || initialContent.staffPassword || "";
      // Migrate legacy single `enabled` flag → enabledWeb
      const enabledWeb =
        initialContent.enabledWeb ?? initialContent.enabled ?? false;
      const enabledMobile = initialContent.enabledMobile ?? false;
      setContent({
        ...EMPTY_MAINTENANCE,
        ...initialContent,
        enabledWeb,
        enabledMobile,
        password: pass,
        staffPassword: pass,
        title: {
          en: initialContent.title?.en || EMPTY_MAINTENANCE.title.en,
          es: initialContent.title?.es || EMPTY_MAINTENANCE.title.es,
        },
        message: {
          en: initialContent.message?.en || EMPTY_MAINTENANCE.message.en,
          es: initialContent.message?.es || EMPTY_MAINTENANCE.message.es,
        },
      });
    }
  }, [initialContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const pass = content.password || content.staffPassword || "";
      const payload: MaintenanceContent = {
        ...content,
        password: pass,
        staffPassword: pass,
        // Keep legacy field in sync so old consumers (web/app) still work
        enabled: content.enabledWeb || content.enabledMobile,
      };

      if ((window as any).electronAPI?.saveSiteContent) {
        const res = await (window as any).electronAPI.saveSiteContent(
          token,
          "maintenance",
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

  const bothOn = content.enabledWeb && content.enabledMobile;
  const webOnly = content.enabledWeb && !content.enabledMobile;
  const mobileOnly = !content.enabledWeb && content.enabledMobile;
  const bothOff = !content.enabledWeb && !content.enabledMobile;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6 max-w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">
            {t("webAdmin.maintenance.title")}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("webAdmin.maintenance.subtitle")}
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

      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
          bothOff
            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
            : "bg-amber-50 border-amber-300 text-amber-900"
        }`}
      >
        <ShieldAlert className="w-5 h-5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-bold">
            {bothOn
              ? t("webAdmin.maintenance.statusBothActive", "Web & Mobile are in Maintenance")
              : webOnly
              ? t("webAdmin.maintenance.statusWebOnly", "Web App is in Maintenance")
              : mobileOnly
              ? t("webAdmin.maintenance.statusMobileOnly", "Mobile App is in Maintenance")
              : t("webAdmin.maintenance.statusBothInactive", "Website & App are LIVE & PUBLIC")}
          </h3>
          <p className="text-xs opacity-80 mt-0.5">
            {bothOff
              ? t("webAdmin.maintenance.statusInactiveSub", "Customer website and app are accessible to all public visitors.")
              : t("webAdmin.maintenance.statusActiveSub", "Affected platforms show the maintenance screen. Staff can use the password bypass.")}
          </p>
        </div>
      </div>

      {/* Per-platform toggle cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Web toggle */}
        <div
          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
            content.enabledWeb
              ? "bg-amber-50 border-amber-300"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg transition-colors ${
                content.enabledWeb
                  ? "bg-amber-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {t("webAdmin.maintenance.webToggleLabel", "Web App")}
              </p>
              <p className="text-xs text-gray-500">
                {t("webAdmin.maintenance.webToggleSub", "Customer website")}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={content.enabledWeb}
              onChange={(e) =>
                setContent({ ...content, enabledWeb: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Mobile toggle */}
        <div
          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
            content.enabledMobile
              ? "bg-amber-50 border-amber-300"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg transition-colors ${
                content.enabledMobile
                  ? "bg-amber-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {t("webAdmin.maintenance.mobileToggleLabel", "Mobile App")}
              </p>
              <p className="text-xs text-gray-500">
                {t("webAdmin.maintenance.mobileToggleSub", "iOS & Android app")}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={content.enabledMobile}
              onChange={(e) =>
                setContent({ ...content, enabledMobile: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      {/* Staff Bypass Password & Estimated Return Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Staff Password with Show/Hide Toggle */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700">
            {t("webAdmin.maintenance.passwordLabel")}
          </label>
          <div className="relative flex items-center">
            <KeyRound className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={content.password || content.staffPassword || ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  password: e.target.value,
                  staffPassword: e.target.value,
                })
              }
              placeholder={t("webAdmin.maintenance.passwordPlaceholder")}
              className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            {t("webAdmin.maintenance.passwordSub")}
          </p>
        </div>

        {/* Estimated Return Time */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700">
            {t("webAdmin.maintenance.estimatedReturnLabel")}
          </label>
          <div className="relative flex items-center">
            <Clock className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="datetime-local"
              value={content.estimatedReturn || ""}
              onChange={(e) =>
                setContent({ ...content, estimatedReturn: e.target.value })
              }
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
            />
          </div>
          <p className="text-[11px] text-gray-500">
            {t("webAdmin.maintenance.estimatedReturnSub")}
          </p>
        </div>
      </div>

      {/* Maintenance Headline (EN / ES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomInput
          type="text"
          name="headlineEn"
          label={`${t("webAdmin.maintenance.headlineLabel")} (${t("webAdmin.common.english")})`}
          preLabel={<FileText className="size-4 text-gray-500 mt-1" />}
          inputClasses="pl-9"
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
          placeholder={t("webAdmin.maintenance.headlinePlaceholderEn")}
          onChange={(e) =>
            setContent({
              ...content,
              title: { ...content.title, en: e.target.value },
            })
          }
        />
        <CustomInput
          type="text"
          name="headlineEs"
          label={`${t("webAdmin.maintenance.headlineLabel")} (${t("webAdmin.common.espanol")})`}
          preLabel={<FileText className="size-4 text-gray-500 mt-1" />}
          inputClasses="pl-9"
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
          placeholder={t("webAdmin.maintenance.headlinePlaceholderEs")}
          onChange={(e) =>
            setContent({
              ...content,
              title: { ...content.title, es: e.target.value },
            })
          }
        />
      </div>

      {/* Maintenance Message (EN / ES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-700">
              {t("webAdmin.maintenance.messageLabel")} ({t("webAdmin.common.english")})
            </label>
            <TranslateButton
              value={content.message.en}
              direction="en→es"
              onTranslated={(v) =>
                setContent({
                  ...content,
                  message: { ...content.message, es: v },
                })
              }
            />
          </div>
          <textarea
            rows={4}
            value={content.message.en}
            onChange={(e) =>
              setContent({
                ...content,
                message: { ...content.message, en: e.target.value },
              })
            }
            placeholder={t("webAdmin.maintenance.messagePlaceholderEn")}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all resize-y"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-700">
              {t("webAdmin.maintenance.messageLabel")} ({t("webAdmin.common.espanol")})
            </label>
            <TranslateButton
              value={content.message.es}
              direction="es→en"
              onTranslated={(v) =>
                setContent({
                  ...content,
                  message: { ...content.message, en: v },
                })
              }
            />
          </div>
          <textarea
            rows={4}
            value={content.message.es}
            onChange={(e) =>
              setContent({
                ...content,
                message: { ...content.message, es: e.target.value },
              })
            }
            placeholder={t("webAdmin.maintenance.messagePlaceholderEs")}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all resize-y"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2 border-t border-gray-100">
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

export default MaintenanceTab;
