import React, { useState, useEffect } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { Megaphone, MessageSquare, Smartphone, Plus, Trash2 } from "lucide-react";
import { LocalisedString } from "./HeroTab";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnnouncementItem {
  id: string;
  text: LocalisedString;
  enabled: boolean;
}

interface AnnouncementData {
  enabled: boolean;
  text?: LocalisedString;
  items?: AnnouncementItem[];
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
  items: [],
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
      let items: AnnouncementItem[] = Array.isArray(initialContent.announcement.items)
        ? initialContent.announcement.items
        : [];
      if (
        items.length === 0 &&
        (initialContent.announcement.text?.en || initialContent.announcement.text?.es)
      ) {
        items = [
          {
            id: '1',
            text: {
              en: initialContent.announcement.text?.en || '',
              es: initialContent.announcement.text?.es || '',
            },
            enabled: initialContent.announcement.enabled ?? true,
          },
        ];
      }
      setAnnouncement({
        enabled: !!initialContent.announcement.enabled,
        text: {
          en: initialContent.announcement.text?.en || '',
          es: initialContent.announcement.text?.es || '',
        },
        items,
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
      const firstItem = announcement.items?.[0];
      const payload = {
        ...announcement,
        text:
          announcement.text?.en || announcement.text?.es
            ? announcement.text
            : firstItem?.text || { en: '', es: '' },
      };
      const ok = await saveKey("announcement", payload);
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
            type="text"
            name="appStoreUrl"
            label={t("webAdmin.notifications.appStoreLabel")}
            value={appLinks.appStoreUrl}
            placeholder={t("webAdmin.notifications.appStorePlaceholder")}
            onChange={(e) =>
              setAppLinks({ ...appLinks, appStoreUrl: e.target.value })
            }
          />
          <CustomInput
            type="text"
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
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
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
                className="w-4 h-4 rounded text-black focus:ring-black border-gray-300 accent-black cursor-pointer"
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

        {/* Dynamic Announcement Items List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t("webAdmin.branding.announcementsList")}
            </span>
            <button
              type="button"
              onClick={() => {
                const newItems: AnnouncementItem[] = [
                  ...(announcement.items || []),
                  {
                    id: String(Date.now()),
                    text: { en: "", es: "" },
                    enabled: true,
                  },
                ];
                setAnnouncement({ ...announcement, items: newItems });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-black cursor-pointer bg-zinc-100 px-2.5 py-1.5 rounded-md hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("webAdmin.branding.addAnnouncement")}</span>
            </button>
          </div>

          {(announcement.items && announcement.items.length > 0) ? (
            <div className="space-y-3">
              {announcement.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 bg-gray-50/80 rounded-lg border border-gray-200/80 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="text-xs font-bold text-gray-700">
                      {t("webAdmin.branding.announcementNumber")} #{idx + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-600">
                        <input
                          type="checkbox"
                          checked={item.enabled !== false}
                          onChange={(e) => {
                            const updated = [...(announcement.items || [])];
                            updated[idx] = { ...updated[idx], enabled: e.target.checked };
                            setAnnouncement({ ...announcement, items: updated });
                          }}
                          className="w-3.5 h-3.5 rounded text-black focus:ring-black border-gray-300 accent-black cursor-pointer"
                        />
                        <span>{t("webAdmin.branding.active")}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (announcement.items || []).filter((_, i) => i !== idx);
                          setAnnouncement({ ...announcement, items: updated });
                        }}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded cursor-pointer"
                        title={t("webAdmin.actions.remove") || "Remove"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <CustomInput
                      type="text"
                      name={`announcement-en-${idx}`}
                      label={`${t("webAdmin.branding.announcementText")} (EN)`}
                      labelAction={
                        <TranslateButton
                          value={item.text?.en || ""}
                          direction="en→es"
                          onTranslated={(v) => {
                            const updated = [...(announcement.items || [])];
                            updated[idx] = {
                              ...updated[idx],
                              text: { ...(updated[idx].text || { en: "", es: "" }), es: v },
                            };
                            setAnnouncement({ ...announcement, items: updated });
                          }}
                        />
                      }
                      value={item.text?.en || ""}
                      placeholder={t("webAdmin.branding.announcementPlaceholderEn")}
                      onChange={(e) => {
                        const updated = [...(announcement.items || [])];
                        updated[idx] = {
                          ...updated[idx],
                          text: { ...(updated[idx].text || { en: "", es: "" }), en: e.target.value },
                        };
                        setAnnouncement({ ...announcement, items: updated });
                      }}
                    />
                    <CustomInput
                      type="text"
                      name={`announcement-es-${idx}`}
                      label={`${t("webAdmin.branding.announcementText")} (ES)`}
                      labelAction={
                        <TranslateButton
                          value={item.text?.es || ""}
                          direction="es→en"
                          onTranslated={(v) => {
                            const updated = [...(announcement.items || [])];
                            updated[idx] = {
                              ...updated[idx],
                              text: { ...(updated[idx].text || { en: "", es: "" }), en: v },
                            };
                            setAnnouncement({ ...announcement, items: updated });
                          }}
                        />
                      }
                      value={item.text?.es || ""}
                      placeholder={t("webAdmin.branding.announcementPlaceholderEs")}
                      onChange={(e) => {
                        const updated = [...(announcement.items || [])];
                        updated[idx] = {
                          ...updated[idx],
                          text: { ...(updated[idx].text || { en: "", es: "" }), es: e.target.value },
                        };
                        setAnnouncement({ ...announcement, items: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500">
              {t("webAdmin.branding.noAnnouncements")}
            </div>
          )}
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
