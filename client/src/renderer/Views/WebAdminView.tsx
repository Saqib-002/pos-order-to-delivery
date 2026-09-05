import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import HeroTab from "../components/webAdmin/HeroTab";
import BrandingTab from "../components/webAdmin/BrandingTab";
import NotificationsTab from "../components/webAdmin/NotificationsTab";
import FooterTab from "../components/webAdmin/FooterTab";
import TermsTab from "../components/webAdmin/TermsTab";
import PrivacyTab from "../components/webAdmin/PrivacyTab";
import FaqTab from "../components/webAdmin/FaqTab";
import AboutTab from "../components/webAdmin/AboutTab";
import ContactTab from "../components/webAdmin/ContactTab";
import AllergensTab from "../components/webAdmin/AllergensTab";
import WebCustomersTab from "../components/webAdmin/WebCustomersTab";
import SupportTab from "../components/webAdmin/SupportTab";
import MaintenanceTab from "../components/webAdmin/MaintenanceTab";
import { RefreshCw, Sparkles } from "lucide-react";

export type TabKey =
  | "hero"
  | "branding"
  | "notifications"
  | "footer"
  | "about"
  | "contact"
  | "faq"
  | "allergens"
  | "terms"
  | "privacy"
  | "maintenance"
  | "customers"
  | "support";

interface WebAdminViewProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const WebAdminView: React.FC<WebAdminViewProps> = ({
  activeTab = "hero",
  onTabChange,
}) => {
  const currentSubview = (activeTab as TabKey) || "hero";
  const { t } = useTranslation();
  const { auth: { token } } = useAuth();
  const [loading, setLoading] = useState(false);
  const [siteData, setSiteData] = useState<Record<string, any>>({});

  const loadLocalContent = useCallback(async () => {
    try {
      if ((window as any).electronAPI?.getSiteContent) {
        const res = await (window as any).electronAPI.getSiteContent(token);
        if (res?.status && res?.data) {
          setSiteData(res.data);
        }
      }
    } catch (err) {
      console.error("Error loading local site content:", err);
    }
  }, [token]);

  const handleFetchRemote = async () => {
    setLoading(true);
    try {
      if ((window as any).electronAPI?.fetchRemoteSiteContent) {
        const res = await (window as any).electronAPI.fetchRemoteSiteContent(token);
        if (res?.status && res?.data) {
          setSiteData(res.data);
          toast.success(t("webAdmin.messages.syncSuccess"));
        } else {
          toast.error(t("webAdmin.messages.syncError"));
        }
      }
    } catch {
      toast.error(t("webAdmin.messages.syncError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocalContent();
  }, [loadLocalContent]);

  const tabIcons: Record<TabKey, string> = {
    hero: "./images/slider.png",
    branding: "./images/branding.png",
    notifications: "./images/notification.png",
    footer: "./images/footer.png",
    about: "./images/about-us.png",
    contact: "./images/contact.png",
    faq: "./images/faq.png",
    allergens: "./images/allergen.png",
    terms: "./images/terms-and-conditions.png",
    privacy: "./images/privacy-policy.png",
    maintenance: "./images/car-maintainence.png",
    customers: "./images/web-customers.png",
    support: "./images/support.png",
  };

  const tabHeaders: Record<TabKey, { title: string; subtitle: string }> = {
    hero: {
      title: t("webAdmin.tabs.hero"),
      subtitle: t("webAdmin.hero.subtitle"),
    },
    branding: {
      title: t("webAdmin.branding.title", "Marca y Configuración Web"),
      subtitle: t("webAdmin.branding.subtitle"),
    },
    notifications: {
      title: t("webAdmin.notifications.title", "Notificaciones y Enlaces"),
      subtitle: t("webAdmin.notifications.subtitle"),
    },
    footer: {
      title: t("webAdmin.tabs.footer"),
      subtitle: t("webAdmin.footer.subtitle"),
    },
    about: {
      title: t("webAdmin.tabs.about"),
      subtitle: t("webAdmin.about.subtitle"),
    },
    contact: {
      title: t("webAdmin.tabs.contact"),
      subtitle: t("webAdmin.contact.subtitle"),
    },
    faq: {
      title: t("webAdmin.tabs.faq"),
      subtitle: t("webAdmin.faq.subtitle"),
    },
    allergens: {
      title: t("webAdmin.tabs.allergens"),
      subtitle: t("webAdmin.allergens.subtitle"),
    },
    terms: {
      title: t("webAdmin.tabs.terms"),
      subtitle: t("webAdmin.terms.subtitle"),
    },
    privacy: {
      title: t("webAdmin.tabs.privacy"),
      subtitle: t("webAdmin.privacy.subtitle"),
    },
    maintenance: {
      title: t("webAdmin.tabs.maintenance", "Modo Mantenimiento"),
      subtitle: t("webAdmin.maintenance.subtitle", "Configuración del modo mantenimiento y acceso del personal"),
    },
    customers: {
      title: t("webAdmin.customers.title", "Clientes Web y App"),
      subtitle: t("webAdmin.customers.subtitle"),
    },
    support: {
      title: t("webAdmin.support.title", "Bandeja de Soporte"),
      subtitle: t("webAdmin.support.subtitle"),
    },
  };

  const currentHeader = tabHeaders[currentSubview] || tabHeaders.hero;
  const activeIconSrc = tabIcons[currentSubview] || "./images/admin-panel.png";

  const renderSubview = () => {
    switch (currentSubview) {
      case "hero":
        return (
          <HeroTab
            initialContent={siteData.hero}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "branding":
        return (
          <BrandingTab
            initialContent={{
              branding: siteData.branding,
            }}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "notifications":
        return (
          <NotificationsTab
            initialContent={{
              announcement: siteData.announcement,
              system: siteData.system,
              "app-links": siteData["app-links"],
            }}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "footer":
        return (
          <FooterTab
            initialContent={siteData.footer}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "about":
        return (
          <AboutTab
            initialContent={siteData.about}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "contact":
        return (
          <ContactTab
            initialContent={siteData.contact}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "faq":
        return (
          <FaqTab
            initialContent={siteData.faq}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "allergens":
        return (
          <AllergensTab
            initialContent={siteData.allergens}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "terms":
        return (
          <TermsTab
            initialContent={siteData.terms}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "privacy":
        return (
          <PrivacyTab
            initialContent={siteData.privacy}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "maintenance":
        return (
          <MaintenanceTab
            initialContent={siteData.maintenance}
            onSaveSuccess={loadLocalContent}
          />
        );
      case "customers":
        return <WebCustomersTab />;
      case "support":
        return <SupportTab />;
      default:
        return (
          <HeroTab
            initialContent={siteData.hero}
            onSaveSuccess={loadLocalContent}
          />
        );
    }
  };

  const isLiveDirectTab = currentSubview === "customers" || currentSubview === "support";

  return (
    <div className="p-6 flex flex-col space-y-6 max-w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-200 gap-4 bg-white/70 p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shadow-2xs shrink-0 p-1.5">
            <img
              src={activeIconSrc}
              alt={currentHeader.title}
              className="size-9 object-contain"
              onError={(e) => {
                e.currentTarget.src = "./images/admin-panel.png";
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                {t("webAdmin.title", "Admin Web y App")}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">
              {currentHeader.title}
            </h1>
            <p className="text-xs text-gray-500">
              {currentHeader.subtitle}
            </p>
          </div>
        </div>

        {!isLiveDirectTab && (
          <button
            type="button"
            onClick={handleFetchRemote}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>
              {loading
                ? t("webAdmin.actions.refreshing")
                : t("webAdmin.actions.refreshCloud")}
            </span>
          </button>
        )}
      </div>

      {/* Subview Content */}
      <div className="pb-8">{renderSubview()}</div>
    </div>
  );
};

export { WebAdminView };
export default WebAdminView;
