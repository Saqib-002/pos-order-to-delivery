import React, { useState, useEffect } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { Megaphone, MessageSquare, Smartphone } from "lucide-react";
import { LocalisedString } from "./HeroTab";

// ── Types ────────────────────────────────────────────────────────────────────

interface AnnouncementData {
  enabled: boolean;
  text: LocalisedString;
}

interface SystemData {
  responseTime: LocalisedString;
}

interface AppLinksData {
  appStoreUrl: string;
  playStoreUrl: string;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const EMPTY_ANNOUNCEMENT: AnnouncementData = {
  enabled: false,
  text: { en: "", es: "" },
};

const EMPTY_SYSTEM: SystemData = {
  responseTime: { en: "", es: "" },
};

const EMPTY_APP_LINKS: AppLinksData = {
  appStoreUrl: "",
  playStoreUrl: "",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface NotificationsTabProps {
  initialContent?: {
    announcement?: any;
    system?: any;
    "app-links"?: any;
  };
  onSaveSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();

  const [announcement, setAnnouncement] = useState<AnnouncementData>(EMPTY_ANNOUNCEMENT);
  const [system, setSystem] = useState<SystemData>(EMPTY_SYSTEM);
  const [appLinks, setAppLinks] = useState<AppLinksData>(EMPTY_APP_LINKS);

  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);
  const [savingAppLinks, setSavingAppLinks] = useState(false);

  // ── Populate from initialContent ─────────────────────────────────────────

  useEffect(() => {
    if (!initialContent) return;

    if (initialContent.announcement) {
      setAnnouncement({
        enabled: !!initialContent.announcement.enabled,
        text: {
          en: initialContent.announcement.text?.en || "",
          es: initialContent.announcement.text?.es || "",
        },
      });
    }

    if (initialContent.system) {
      setSystem({
        responseTime: {
          en: initialContent.system.responseTime?.en || "",
          es: initialContent.system.responseTime?.es || "",
        },
      });
    }

    const links = initialContent["app-links"];
    if (links) {
      setAppLinks({
        appStoreUrl: links.appStoreUrl || "",
        playStoreUrl: links.playStoreUrl || "",
      });
    }
  }, [initialContent]);

  // ── Save helpers ──────────────────────────────────────────────────────────

  const saveKey = async (key: string, data: any) => {
    if (!(window as any).electronAPI?.saveSiteContent) return false;
    const res = await (window as any).electronAPI.saveSiteContent(token, key, data);
    return !!res?.status;
  };

  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    try {
      const ok = await saveKey("announcement", announcement);
      if (ok) {
        toast.success(t("webAdmin.messages.saveSuccess"));
        onSaveSuccess?.();
      } else {
        toast.error(t("webAdmin.messages.saveError"));
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleSaveSystem = async () => {
    setSavingSystem(true);
    try {
      const ok = await saveKey("system", system);
      if (ok) {
        toast.success(t("webAdmin.messages.saveSuccess"));
        onSaveSuccess?.();
      } else {
        toast.error(t("webAdmin.messages.saveError"));
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    } finally {
      setSavingSystem(false);
    }
  };

  const handleSaveAppLinks = async () => {
    setSavingAppLinks(true);
    try {
      const ok = await saveKey("app-links", appLinks);
      if (ok) {
        toast.success(t("webAdmin.messages.saveSuccess"));
        onSaveSuccess?.();
      } else {
        toast.error(t("webAdmin.messages.saveError"));
      }
    } catch {
      toast.error(t("webAdmin.messages.saveError"));
    } finally {
      setSavingAppLinks(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-full">

      {/* ── App Links Card ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-gray-500" />
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {t("webAdmin.notifications.appLinksTitle")}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("webAdmin.notifications.appLinksSubtitle")}
              </p>
            </div>
          </div>
          <CustomButton
            type="button"
            variant="primary"
            isLoading={savingAppLinks}
            label={
              savingAppLinks
                ? t("webAdmin.actions.saving")
                : t("webAdmin.actions.save")
            }
            onClick={handleSaveAppLinks}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            type="url"
            name="appStoreUrl"
            label={t("webAdmin.notifications.appStoreLabel")}
            value={appLinks.appStoreUrl}
            placeholder={t("webAdmin.notifications.appStorePlaceholder")}
            onChange={(e) =>
              setAppLinks({ ...appLinks, appStoreUrl: e.target.value })
            }
          />
          <CustomInput
            type="url"
            name="playStoreUrl"
            label={t("webAdmin.notifications.playStoreLabel")}
            value={appLinks.playStoreUrl}
            placeholder={t("webAdmin.notifications.playStorePlaceholder")}
            onChange={(e) =>
              setAppLinks({ ...appLinks, playStoreUrl: e.target.value })
            }
          />
        </div>
      </div>

      {/* ── Announcement Bar Card ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-gray-500" />
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {t("webAdmin.branding.announcementTitle")}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("webAdmin.branding.announcementSubtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={announcement.enabled}
                onChange={(e) =>
                  setAnnouncement({ ...announcement, enabled: e.target.checked })
                }
                className="w-4 h-4 rounded text-black focus:ring-black border-gray-300"
              />
              <span className="text-xs font-semibold text-gray-800">
                {t("webAdmin.branding.announcementActive")}
              </span>
            </label>
            <CustomButton
              type="button"
              variant="primary"
              isLoading={savingAnnouncement}
              label={
                savingAnnouncement
                  ? t("webAdmin.actions.saving")
                  : t("webAdmin.actions.save")
              }
              onClick={handleSaveAnnouncement}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            type="text"
            name="announcementTextEn"
            label={`${t("webAdmin.branding.announcementText")} (EN)`}
            labelAction={
              <TranslateButton
                value={announcement.text.en}
                direction="en→es"
                onTranslated={(v) =>
                  setAnnouncement({
                    ...announcement,
                    text: { ...announcement.text, es: v },
                  })
                }
              />
            }
            value={announcement.text.en}
            placeholder={t("webAdmin.branding.announcementPlaceholderEn")}
            onChange={(e) =>
              setAnnouncement({
                ...announcement,
                text: { ...announcement.text, en: e.target.value },
              })
            }
          />
          <CustomInput
            type="text"
            name="announcementTextEs"
            label={`${t("webAdmin.branding.announcementText")} (ES)`}
            labelAction={
              <TranslateButton
                value={announcement.text.es}
                direction="es→en"
                onTranslated={(v) =>
                  setAnnouncement({
                    ...announcement,
                    text: { ...announcement.text, en: v },
                  })
                }
              />
            }
            value={announcement.text.es}
            placeholder={t("webAdmin.branding.announcementPlaceholderEs")}
            onChange={(e) =>
              setAnnouncement({
                ...announcement,
                text: { ...announcement.text, es: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* ── Response Time Card ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {t("webAdmin.branding.systemTitle")}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("webAdmin.branding.systemSubtitle")}
              </p>
            </div>
          </div>
          <CustomButton
            type="button"
            variant="primary"
            isLoading={savingSystem}
            label={
              savingSystem
                ? t("webAdmin.actions.saving")
                : t("webAdmin.actions.save")
            }
            onClick={handleSaveSystem}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            type="text"
            name="responseTimeEn"
            label={`${t("webAdmin.branding.responseTime")} (EN)`}
            labelAction={
              <TranslateButton
                value={system.responseTime.en}
                direction="en→es"
                onTranslated={(v) =>
                  setSystem({
                    ...system,
                    responseTime: { ...system.responseTime, es: v },
                  })
                }
              />
            }
            value={system.responseTime.en}
            placeholder={t("webAdmin.branding.responseTimePlaceholderEn")}
            onChange={(e) =>
              setSystem({
                ...system,
                responseTime: { ...system.responseTime, en: e.target.value },
              })
            }
          />
          <CustomInput
            type="text"
            name="responseTimeEs"
            label={`${t("webAdmin.branding.responseTime")} (ES)`}
            labelAction={
              <TranslateButton
                value={system.responseTime.es}
                direction="es→en"
                onTranslated={(v) =>
                  setSystem({
                    ...system,
                    responseTime: { ...system.responseTime, en: v },
                  })
                }
              />
            }
            value={system.responseTime.es}
            placeholder={t("webAdmin.branding.responseTimePlaceholderEs")}
            onChange={(e) =>
              setSystem({
                ...system,
                responseTime: { ...system.responseTime, es: e.target.value },
              })
            }
          />
        </div>
      </div>

    </div>
  );
};

export default NotificationsTab;
