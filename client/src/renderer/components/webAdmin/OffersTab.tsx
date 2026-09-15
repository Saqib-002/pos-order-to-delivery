import React, { useState, useEffect, useRef } from "react";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../ui/CustomButton";
import TranslateButton from "./TranslateButton";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/renderer/contexts/AuthContext";
import { useConfigurations } from "@/renderer/contexts/configurationContext";
import { formatImageUrl } from "../../utils/imageUrl";
import {
  compressImageFile,
  fileToBase64,
  type CompressInfo,
} from "../../utils/imageCompression";
import { ImageAspectHint } from "../shared/ImageAspectHint";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import dayjs, { Dayjs } from "dayjs";
import { DateRangePicker } from "../ui/DateRangePicker";
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  Search,
  Check,
  Tag,
  UtensilsCrossed,
  Layers,
  Calendar,
  CalendarDays,
  Clock,
  Info,
  Moon,
  Utensils,
  Wine,
} from "lucide-react";

export interface LocalisedString {
  en: string;
  es: string;
}

export interface OfferTargetItem {
  type: "product" | "menu";
  id: string;
  name: string;
  price: number;
  imgUrl?: string;
}

export interface OfferSchedule {
  hasDateRange: boolean;
  startDate?: string;
  endDate?: string;
  allDays: boolean;
  days: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  hasTimeRange: boolean;
  startTime?: string; // "00:00"
  endTime?: string;   // "23:59"
}

export const DEFAULT_SCHEDULE: OfferSchedule = {
  hasDateRange: false,
  startDate: "",
  endDate: "",
  allDays: true,
  days: [1, 2, 3, 4, 5, 6, 0],
  hasTimeRange: false,
  startTime: "00:00",
  endTime: "23:59",
};

export function formatScheduleSummary(schedule?: OfferSchedule, t?: any): string {
  if (!schedule) return t ? t("webAdmin.offers.summaryAlwaysActive", "Siempre activa") : "Siempre activa";

  const parts: string[] = [];

  // Expiration / Date
  if (schedule.hasDateRange) {
    if (schedule.endDate) {
      const d = new Date(schedule.endDate);
      if (!isNaN(d.getTime())) {
        const dateStr = d.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        parts.push(t ? t("webAdmin.offers.summaryExpires", { date: dateStr, defaultValue: `Exp: ${dateStr}` }) : `Exp: ${dateStr}`);
      }
    }
  }

  // Days
  if (!schedule.allDays && Array.isArray(schedule.days) && schedule.days.length > 0) {
    if (schedule.days.length === 5 && [1, 2, 3, 4, 5].every((d) => schedule.days.includes(d))) {
      parts.push(t ? t("webAdmin.offers.scheduleMonFri", "Lun-Vie") : "Lun-Vie");
    } else if (schedule.days.length === 2 && [6, 0].every((d) => schedule.days.includes(d))) {
      parts.push(t ? t("webAdmin.offers.scheduleWeekends", "Fin de semana") : "Fin de semana");
    } else if (schedule.days.length === 7) {
      parts.push(t ? t("webAdmin.offers.scheduleAll7Days", "Los 7 días") : "Los 7 días");
    } else {
      const dayNames = schedule.days.map((d) => (t ? t(`webAdmin.offers.days.${d}`) : String(d)));
      parts.push(dayNames.join(", "));
    }
  } else {
    parts.push(t ? t("webAdmin.offers.summaryEveryDay", "Todos los días") : "Todos los días");
  }

  // Hours
  if (schedule.hasTimeRange && schedule.startTime && schedule.endTime) {
    parts.push(`${schedule.startTime} - ${schedule.endTime}`);
  }

  return parts.join(" • ");
}

export function getScheduleStatus(schedule?: OfferSchedule, t?: any): {
  status: "live" | "scheduled" | "expired" | "off_day" | "off_hours";
  label: string;
  badgeClass: string;
} {
  if (!schedule) {
    return {
      status: "live",
      label: t ? t("webAdmin.offers.statusAlwaysActive", "Siempre Activa") : "Siempre Activa",
      badgeClass: "bg-emerald-500 text-white",
    };
  }

  const now = new Date();

  // 1. Check Date Range
  if (schedule.hasDateRange) {
    if (schedule.startDate) {
      const start = new Date(schedule.startDate);
      if (!isNaN(start.getTime()) && now < start) {
        return {
          status: "scheduled",
          label: t ? t("webAdmin.offers.statusUpcoming", "Próxima") : "Próxima",
          badgeClass: "bg-gray-700 text-white",
        };
      }
    }
    if (schedule.endDate) {
      const end = new Date(schedule.endDate);
      if (!isNaN(end.getTime()) && now > end) {
        return {
          status: "expired",
          label: t ? t("webAdmin.offers.statusExpired", "Expirada") : "Expirada",
          badgeClass: "bg-amber-600 text-white",
        };
      }
    }
  }

  // 2. Check Days
  if (!schedule.allDays && Array.isArray(schedule.days) && schedule.days.length > 0) {
    const currentDay = now.getDay();
    if (!schedule.days.includes(currentDay)) {
      return {
        status: "off_day",
        label: t ? t("webAdmin.offers.statusOffDay", "Día Inactivo") : "Día Inactivo",
        badgeClass: "bg-gray-600 text-white",
      };
    }
  }

  // 3. Check Hours
  if (schedule.hasTimeRange && schedule.startTime && schedule.endTime) {
    const currentTotalMins = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const startTotalMins = (startH || 0) * 60 + (startM || 0);
    const endTotalMins = (endH || 0) * 60 + (endM || 0);

    let isWithinHours = false;
    if (startTotalMins <= endTotalMins) {
      isWithinHours = currentTotalMins >= startTotalMins && currentTotalMins <= endTotalMins;
    } else {
      isWithinHours = currentTotalMins >= startTotalMins || currentTotalMins <= endTotalMins;
    }

    if (!isWithinHours) {
      return {
        status: "off_hours",
        label: t ? t("webAdmin.offers.statusOffHours", "Fuera de Horario") : "Fuera de Horario",
        badgeClass: "bg-gray-600 text-white",
      };
    }
  }

  return {
    status: "live",
    label: t ? t("webAdmin.offers.statusLiveNow", "En Vivo") : "En Vivo",
    badgeClass: "bg-emerald-500 text-white",
  };
}

export function isOfferCurrentlyValid(schedule?: OfferSchedule, now: Date = new Date()): boolean {
  if (!schedule) return true;

  if (schedule.hasDateRange) {
    if (schedule.startDate) {
      const start = new Date(schedule.startDate);
      if (!isNaN(start.getTime()) && now < start) return false;
    }
    if (schedule.endDate) {
      const end = new Date(schedule.endDate);
      if (!isNaN(end.getTime()) && now > end) return false;
    }
  }

  if (!schedule.allDays && Array.isArray(schedule.days) && schedule.days.length > 0) {
    if (!schedule.days.includes(now.getDay())) return false;
  }

  if (schedule.hasTimeRange && schedule.startTime && schedule.endTime) {
    const currentTotalMins = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const startTotalMins = (startH || 0) * 60 + (startM || 0);
    const endTotalMins = (endH || 0) * 60 + (endM || 0);

    if (startTotalMins <= endTotalMins) {
      if (currentTotalMins < startTotalMins || currentTotalMins > endTotalMins) return false;
    } else {
      if (currentTotalMins < startTotalMins && currentTotalMins > endTotalMins) return false;
    }
  }

  return true;
}

export interface OfferItem {
  id: string;
  title?: LocalisedString | string;
  imageUrl: string;
  buttonText?: LocalisedString | string;
  priority: number;
  isActive: boolean;
  targets: OfferTargetItem[];
  createdAt?: string;
  schedule?: OfferSchedule;
}

export interface OffersContent {
  offers?: OfferItem[];
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  imgUrl?: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  imgUrl?: string;
}

interface OffersTabProps {
  initialContent?: OffersContent | OfferItem[];
  onSaveSuccess?: () => void;
}

interface OfferFormData {
  id: string;
  title: LocalisedString;
  imageUrl: string;
  buttonText: LocalisedString;
  priority: number;
  isActive: boolean;
  targets: OfferTargetItem[];
  schedule: OfferSchedule;
}

const DEFAULT_FORM: OfferFormData = {
  id: "",
  title: { en: "", es: "" },
  imageUrl: "",
  buttonText: { en: "Add to Cart", es: "Añadir al Pedido" },
  priority: 10,
  isActive: true,
  targets: [],
  schedule: { ...DEFAULT_SCHEDULE },
};

export const OffersTab: React.FC<OffersTabProps> = ({
  initialContent,
  onSaveSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const { language } = useConfigurations();
  const isEn =
    language === "en" ||
    (i18n.language || "").toLowerCase().startsWith("en") ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("language") || "").toLowerCase().startsWith("en"));
  const currentLang = isEn ? "en" : "es";
  const {
    auth: { token },
  } = useAuth();

  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [saving, setSaving] = useState(false);

  const envBaseUrl =
    (import.meta as any).env?.VITE_DRIVER_API_URL?.replace(/\/api\/?$/, "") ||
    "";
  const [driverApiUrl, setDriverApiUrl] = useState<string>(envBaseUrl);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [modalTab, setModalTab] = useState<"details" | "targets" | "time">("details");
  const [formData, setFormData] = useState<OfferFormData>(DEFAULT_FORM);

  // Target item selector states
  const [activeTab, setActiveTab] = useState<"products" | "menus">("products");
  const [itemSearch, setItemSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressInfo, setCompressInfo] = useState<CompressInfo | null>(null);

  // Fetch driver API URL
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

  // Fetch products and menus for target selector
  useEffect(() => {
    async function loadCatalog() {
      try {
        if ((window as any).electronAPI?.getAllProducts) {
          const res = await (window as any).electronAPI.getAllProducts(token);
          if (res?.status && Array.isArray(res.data)) {
            setProducts(
              res.data.map((p: any) => ({
                id: p.id || p._id,
                name: p.name || "",
                price: Number(p.price) || 0,
                imgUrl: p.imgUrl || p.image || "",
              }))
            );
          }
        }

        if ((window as any).electronAPI?.getMenus) {
          const res = await (window as any).electronAPI.getMenus(token);
          if (res?.status && Array.isArray(res.data)) {
            setMenus(
              res.data.map((m: any) => ({
                id: m.id || m._id,
                name: m.name || "",
                price: Number(m.price) || 0,
                imgUrl: m.imgUrl || m.image || "",
              }))
            );
          }
        }
      } catch (err) {
        console.error("Error loading products/menus in OffersTab:", err);
      }
    }

    loadCatalog();
  }, [token]);

  // Load initial offers
  useEffect(() => {
    if (!initialContent) return;
    const rawList = Array.isArray(initialContent)
      ? initialContent
      : Array.isArray(initialContent.offers)
      ? initialContent.offers
      : [];

    const sorted = [...rawList].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
    setOffers(sorted);
  }, [initialContent]);

  // Open modal for Create
  const handleOpenCreate = () => {
    const nextPriority =
      offers.length > 0
        ? Math.max(...offers.map((o) => o.priority || 0)) + 10
        : 10;

    setFormData({
      ...DEFAULT_FORM,
      id: `offer-${Date.now()}`,
      priority: nextPriority,
      buttonText: {
        en: "Add to Cart",
        es: "Añadir al Pedido",
      },
    });
    setIsNew(true);
    setModalTab("details");
    setCompressInfo(null);
    setItemSearch("");
    setActiveTab("products");
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (offer: OfferItem) => {
    const titleObj: LocalisedString =
      typeof offer.title === "object" && offer.title !== null
        ? { en: offer.title.en || "", es: offer.title.es || "" }
        : { en: typeof offer.title === "string" ? offer.title : "", es: "" };

    const btnObj: LocalisedString =
      typeof offer.buttonText === "object" && offer.buttonText !== null
        ? { en: offer.buttonText.en || "", es: offer.buttonText.es || "" }
        : {
            en: typeof offer.buttonText === "string" ? offer.buttonText : "Add to Cart",
            es: "Añadir al Pedido",
          };

    setFormData({
      id: offer.id,
      title: titleObj,
      imageUrl: offer.imageUrl || "",
      buttonText: btnObj,
      priority: offer.priority ?? 10,
      isActive: offer.isActive ?? true,
      targets: Array.isArray(offer.targets) ? [...offer.targets] : [],
      schedule: offer.schedule
        ? {
            hasDateRange: Boolean(offer.schedule.hasDateRange),
            startDate: offer.schedule.startDate || "",
            endDate: offer.schedule.endDate || "",
            allDays: offer.schedule.allDays ?? true,
            days: Array.isArray(offer.schedule.days)
              ? [...offer.schedule.days]
              : [1, 2, 3, 4, 5, 6, 0],
            hasTimeRange: Boolean(offer.schedule.hasTimeRange),
            startTime: offer.schedule.startTime || "00:00",
            endTime: offer.schedule.endTime || "23:59",
          }
        : { ...DEFAULT_SCHEDULE },
    });
    setIsNew(false);
    setModalTab("details");
    setCompressInfo(null);
    setItemSearch("");
    setActiveTab("products");
    setModalOpen(true);
  };

  // Image upload & compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setCompressing(true);
    setCompressInfo(null);

    try {
      const { outputFile, compressInfo: info } = await compressImageFile(file);
      const base64 = await fileToBase64(outputFile);
      setFormData((prev) => ({ ...prev, imageUrl: base64 }));
      setCompressInfo(info);
    } catch (err) {
      console.error("Compression failed, using direct base64:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imageUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    setCompressInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Target toggle in modal
  const handleToggleTarget = (item: ProductItem | MenuItem, type: "product" | "menu") => {
    setFormData((prev) => {
      const exists = prev.targets.some((t) => t.id === item.id && t.type === type);
      if (exists) {
        return {
          ...prev,
          targets: prev.targets.filter((t) => !(t.id === item.id && t.type === type)),
        };
      }
      const newTarget: OfferTargetItem = {
        type,
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        imgUrl: item.imgUrl || "",
      };
      return {
        ...prev,
        targets: [...prev.targets, newTarget],
      };
    });
  };

  const handleRemoveTarget = (id: string, type: "product" | "menu") => {
    setFormData((prev) => ({
      ...prev,
      targets: prev.targets.filter((t) => !(t.id === id && t.type === type)),
    }));
  };

  // Commit modal changes to offers list
  const handleApplyModal = () => {
    if (!formData.imageUrl) {
      toast.error(
        currentLang === "es"
          ? "Por favor sube una imagen para la oferta"
          : "Please upload an image for the offer"
      );
      return;
    }

    if (formData.targets.length === 0) {
      toast.error(
        currentLang === "es"
          ? "Debes seleccionar al menos un producto o menú para la oferta"
          : "Please select at least one product or menu for the offer"
      );
      return;
    }

    const updatedItem: OfferItem = {
      id: formData.id,
      title:
        formData.title.en.trim() || formData.title.es.trim()
          ? formData.title
          : undefined,
      imageUrl: formData.imageUrl,
      buttonText:
        formData.buttonText.en.trim() || formData.buttonText.es.trim()
          ? formData.buttonText
          : undefined,
      priority: Number(formData.priority) || 0,
      isActive: formData.isActive,
      targets: formData.targets,
      schedule: formData.schedule,
    };

    setOffers((prev) => {
      let next: OfferItem[];
      if (isNew) {
        next = [updatedItem, ...prev];
      } else {
        next = prev.map((o) => (o.id === updatedItem.id ? updatedItem : o));
      }
      return next.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    });

    setModalOpen(false);
  };

  // Toggle active status directly on list
  const handleToggleActive = (id: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o))
    );
  };

  // Delete offer
  const handleDeleteOffer = (id: string) => {
    if (window.confirm(t("webAdmin.offers.deleteConfirm", "¿Estás seguro de que deseas eliminar esta oferta?"))) {
      setOffers((prev) => prev.filter((o) => o.id !== id));
    }
  };

  // Save all offers to local store & sync to VPS
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if ((window as any).electronAPI?.saveSiteContent) {
        const payload = {
          offers,
        };
        const res = await (window as any).electronAPI.saveSiteContent(
          token,
          "offers",
          payload
        );
        if (res?.status) {
          toast.success(t("webAdmin.messages.saveSuccess"));
          onSaveSuccess?.();
        } else {
          toast.error(res?.message || t("webAdmin.messages.saveError"));
        }
      }
    } catch (err) {
      console.error("Failed to save offers:", err);
      toast.error(t("webAdmin.messages.saveError"));
    } finally {
      setSaving(false);
    }
  };

  // Filter products / menus for selection
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(itemSearch.toLowerCase().trim())
  );
  const filteredMenus = menus.filter((m) =>
    m.name.toLowerCase().includes(itemSearch.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 max-w-full">
      {/* ── Offers List Section ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>
                {t("webAdmin.offers.title", "Ofertas Promocionales")} (
                {offers.length})
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t(
                "webAdmin.offers.subtitle",
                "Gestiona las ventanas emergentes promocionales que se muestran a los clientes en la web y la app."
              )}
            </p>
          </div>
          <CustomButton
            type="button"
            variant="secondary"
            onClick={handleOpenCreate}
            label={t("webAdmin.offers.addOffer", "Nueva Oferta")}
          />
        </div>

        {offers.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <Tag className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
              {t(
                "webAdmin.offers.noOffers",
                "No hay ofertas configuradas aún. Crea tu primera oferta promocional."
              )}
            </p>
            <CustomButton
              type="button"
              variant="secondary"
              onClick={handleOpenCreate}
              label={t("webAdmin.offers.addOffer", "Nueva Oferta")}
              className="mx-auto"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer, idx) => {
              const displaySrc = formatImageUrl(offer.imageUrl, driverApiUrl);
              const scheduleStatus = getScheduleStatus(offer.schedule, t);
              const titleText =
                typeof offer.title === "object" && offer.title !== null
                  ? (isEn
                      ? offer.title.en || offer.title.es
                      : offer.title.es || offer.title.en) || ""
                  : typeof offer.title === "string"
                  ? offer.title
                  : "";

              const secondaryTitle =
                typeof offer.title === "object" && offer.title !== null
                  ? (isEn ? offer.title.es : offer.title.en) || ""
                  : "";

              const btnText =
                typeof offer.buttonText === "object" && offer.buttonText !== null
                  ? (isEn
                      ? offer.buttonText.en || offer.buttonText.es
                      : offer.buttonText.es || offer.buttonText.en) || ""
                  : typeof offer.buttonText === "string"
                  ? offer.buttonText
                  : "";

              return (
                <div
                  key={offer.id || idx}
                  className={`bg-gray-50 border rounded-lg overflow-hidden transition-all flex flex-col justify-between ${
                    offer.isActive
                      ? "border-gray-200 shadow-sm"
                      : "border-gray-200 opacity-60 bg-gray-100"
                  }`}
                >
                  {/* Card Banner Image (2:1 aspect ratio) */}
                  <div className="relative w-full aspect-[2/1] bg-gray-200 border-b border-gray-200 overflow-hidden flex items-center justify-center">
                    {displaySrc ? (
                      <img
                        src={displaySrc}
                        alt={titleText || "Offer"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}

                    {/* Priority & Status Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white rounded text-[10px] font-bold">
                        Prio: {offer.priority ?? 10}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      {offer.schedule?.hasDateRange && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            scheduleStatus.badgeClass
                          }`}
                        >
                          {scheduleStatus.label}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          offer.isActive
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        {offer.isActive
                          ? t("webAdmin.offers.activeBadge", "Activa")
                          : t("webAdmin.offers.inactiveBadge", "Inactiva")}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {titleText || (
                          <span className="text-gray-400 italic">
                            ({t("webAdmin.offers.noTitle", "Sin título")})
                          </span>
                        )}
                      </h4>
                      {secondaryTitle && (
                        <p className="text-xs text-gray-500 truncate">
                          {secondaryTitle}
                        </p>
                      )}
                    </div>

                    {/* Target Products & Menus count preview */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                        <span>
                          {t(
                            "webAdmin.offers.selectedItems",
                            "Artículos Seleccionados"
                          )}
                        </span>
                        <span className="bg-gray-200 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-gray-700">
                          {offer.targets?.length || 0}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {offer.targets?.map((tgt) => (
                          <span
                            key={`${tgt.type}-${tgt.id}`}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-700 font-medium"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                tgt.type === "menu"
                                  ? "bg-black"
                                  : "bg-emerald-500"
                              }`}
                            />
                            <span className="truncate max-w-[120px]">
                              {tgt.name}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Schedule summary */}
                    <div className="pt-2 border-t border-gray-200/80 flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{formatScheduleSummary(offer.schedule, t)}</span>
                    </div>

                    {/* Actions toolbar */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(offer.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                          offer.isActive
                            ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            : "text-gray-600 bg-gray-200 hover:bg-gray-300"
                        }`}
                        title={
                          offer.isActive
                            ? t("webAdmin.offers.activeBadge", "Activa")
                            : t("webAdmin.offers.inactiveBadge", "Inactiva")
                        }
                      >
                        {offer.isActive ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t("webAdmin.offers.activeBadge", "Activa")}</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{t("webAdmin.offers.inactiveBadge", "Inactiva")}</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(offer)}
                          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded text-xs transition-colors cursor-pointer"
                          title={t("webAdmin.common.edit")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded text-xs transition-colors cursor-pointer"
                          title={t("webAdmin.common.delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* ── Add / Edit Offer Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  {isNew
                    ? t("webAdmin.offers.addOffer", "Nueva Oferta")
                    : t("webAdmin.offers.editOffer", "Editar Oferta")}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {modalTab === "details"
                    ? t("webAdmin.offers.modalTabDetails", "Detalles de la Oferta")
                    : modalTab === "targets"
                    ? t("webAdmin.offers.modalTabTargets", "Productos y Menús Destino")
                    : t("webAdmin.offers.modalTabTime", "Horario y Tiempo")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex border-b border-gray-200 px-6 bg-white gap-6">
              <button
                type="button"
                onClick={() => setModalTab("details")}
                className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  modalTab === "details"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>
                  {t("webAdmin.offers.modalTabDetails", "1. Detalles")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("targets")}
                className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  modalTab === "targets"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>
                  {t(
                    "webAdmin.offers.modalTabTargets",
                    "2. Productos y Menús"
                  )}{" "}
                  ({formData.targets.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("time")}
                className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  modalTab === "time"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {t("webAdmin.offers.modalTabTime", "3. Horario y Tiempo")}
                </span>
                {(formData.schedule.hasDateRange || !formData.schedule.allDays || formData.schedule.hasTimeRange) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {modalTab === "details" && (
                <>
                  {/* Priority & Active toggle row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {t("webAdmin.offers.priorityLabel", "Prioridad")}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priority: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        {t(
                          "webAdmin.offers.priorityHint",
                          "Mayor número = se muestra primero (ej. 10, 20)"
                        )}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {t("webAdmin.offers.activeLabel", "Estado")}
                      </label>
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              isActive: !formData.isActive,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            formData.isActive ? "bg-emerald-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.isActive
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="text-xs font-medium text-gray-700">
                          {formData.isActive
                            ? t("webAdmin.offers.activeBadge", "Activa")
                            : t("webAdmin.offers.inactiveBadge", "Inactiva")}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {t(
                          "webAdmin.offers.activeHint",
                          "Mostrar esta oferta emergente a los clientes en la web"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Title (EN / ES) */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomInput
                        type="text"
                        name="titleEn"
                        label={`${t("webAdmin.offers.offerTitleLabel", "Título")} (EN)`}
                        labelAction={
                          <TranslateButton
                            value={formData.title.en}
                            direction="en→es"
                            onTranslated={(v) =>
                              setFormData({
                                ...formData,
                                title: { ...formData.title, es: v },
                              })
                            }
                          />
                        }
                        value={formData.title.en}
                        placeholder={t(
                          "webAdmin.offers.offerTitlePlaceholderEn",
                          "e.g. Weekend Feast Deal"
                        )}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            title: { ...formData.title, en: e.target.value },
                          })
                        }
                      />

                      <CustomInput
                        type="text"
                        name="titleEs"
                        label={`${t("webAdmin.offers.offerTitleLabel", "Título")} (ES)`}
                        labelAction={
                          <TranslateButton
                            value={formData.title.es}
                            direction="es→en"
                            onTranslated={(v) =>
                              setFormData({
                                ...formData,
                                title: { ...formData.title, en: v },
                              })
                            }
                          />
                        }
                        value={formData.title.es}
                        placeholder={t(
                          "webAdmin.offers.offerTitlePlaceholderEs",
                          "ej. Super Oferta Fin de Semana"
                        )}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            title: { ...formData.title, es: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Button Text (EN / ES) */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomInput
                        type="text"
                        name="btnEn"
                        label={`${t("webAdmin.offers.buttonTextLabel", "Texto del Botón")} (EN)`}
                        labelAction={
                          <TranslateButton
                            value={formData.buttonText.en}
                            direction="en→es"
                            onTranslated={(v) =>
                              setFormData({
                                ...formData,
                                buttonText: {
                                  ...formData.buttonText,
                                  es: v,
                                },
                              })
                            }
                          />
                        }
                        value={formData.buttonText.en}
                        placeholder={t(
                          "webAdmin.offers.buttonTextPlaceholderEn",
                          "e.g. Add to Cart"
                        )}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            buttonText: {
                              ...formData.buttonText,
                              en: e.target.value,
                            },
                          })
                        }
                      />

                      <CustomInput
                        type="text"
                        name="btnEs"
                        label={`${t("webAdmin.offers.buttonTextLabel", "Texto del Botón")} (ES)`}
                        labelAction={
                          <TranslateButton
                            value={formData.buttonText.es}
                            direction="es→en"
                            onTranslated={(v) =>
                              setFormData({
                                ...formData,
                                buttonText: {
                                  ...formData.buttonText,
                                  en: v,
                                },
                              })
                            }
                          />
                        }
                        value={formData.buttonText.es}
                        placeholder={t(
                          "webAdmin.offers.buttonTextPlaceholderEs",
                          "ej. Añadir al Pedido"
                        )}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            buttonText: {
                              ...formData.buttonText,
                              es: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      {t(
                        "webAdmin.offers.imageLabel",
                        "Imagen del Banner de la Oferta"
                      )}
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                      <div className="w-40 aspect-[2/1] rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {compressing ? (
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        ) : formData.imageUrl ? (
                          <img
                            src={formatImageUrl(formData.imageUrl, driverApiUrl)}
                            alt="Offer preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={compressing}
                            className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {compressing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {compressing
                                ? t("common.compressing", "Comprimiendo…")
                                : t(
                                    "webAdmin.about.uploadImage",
                                    "Subir Banner (2:1)"
                                  )}
                            </span>
                          </button>

                          {formData.imageUrl && !compressing && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>
                                {t("webAdmin.about.removeImage", "Eliminar")}
                              </span>
                            </button>
                          )}
                        </div>

                        <ImageAspectHint
                          ratio="2:1"
                          width={1200}
                          height={600}
                        />

                        {compressInfo && (
                          <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5 flex-wrap">
                            <span>
                              {(compressInfo.original / 1024).toFixed(0)} KB →{" "}
                              {(compressInfo.compressed / 1024).toFixed(0)} KB
                            </span>
                            <span className="text-gray-400 font-normal">
                              ({Math.round(
                                (1 -
                                  compressInfo.compressed /
                                    compressInfo.original) *
                                  100
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
                </>
              )}

              {modalTab === "targets" && (
                /* ── Targets Tab ── */
                <div className="space-y-4">
                  {/* Selected Items summary chips */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700">
                        {t("webAdmin.offers.selectedItems", "Artículos Seleccionados")} (
                        {formData.targets.length}):
                      </span>
                      {formData.targets.length === 0 && (
                        <span className="text-[11px] text-red-500 font-medium">
                          {t(
                            "webAdmin.offers.noItemsSelected",
                            "Ningún artículo seleccionado aún."
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                      {formData.targets.map((tgt) => (
                        <span
                          key={`${tgt.type}-${tgt.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 rounded-full text-xs text-gray-800 font-medium shadow-2xs"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tgt.type === "menu"
                                ? "bg-black"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span>{tgt.name}</span>
                          <span className="text-gray-400 font-normal">
                            {tgt.price.toFixed(2).replace('.', ',')}€
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveTarget(tgt.id, tgt.type)
                            }
                            className="text-gray-400 hover:text-red-600 p-0.5 ml-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setActiveTab("products")}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                          activeTab === "products"
                            ? "bg-white text-gray-900 shadow-xs"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        {t("webAdmin.offers.tabProducts", "Productos")} (
                        {products.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("menus")}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                          activeTab === "menus"
                            ? "bg-white text-gray-900 shadow-xs"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        {t("webAdmin.offers.tabMenus", "Menús Combo")} (
                        {menus.length})
                      </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={t(
                          "webAdmin.offers.searchItemsPlaceholder",
                          "Buscar…"
                        )}
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-gray-100 bg-white">
                    {activeTab === "products" ? (
                      filteredProducts.length === 0 ? (
                        <p className="p-6 text-center text-xs text-gray-400">
                          {t("common.noResults", "No se encontraron productos.")}
                        </p>
                      ) : (
                        filteredProducts.map((prod) => {
                          const isSelected = formData.targets.some(
                            (t) => t.id === prod.id && t.type === "product"
                          );
                          const img = formatImageUrl(prod.imgUrl, driverApiUrl);

                          return (
                            <div
                              key={prod.id}
                              onClick={() =>
                                handleToggleTarget(prod, "product")
                              }
                              className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-emerald-50/60 hover:bg-emerald-50"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                  {img ? (
                                    <img
                                      src={img}
                                      alt={prod.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <UtensilsCrossed className="w-5 h-5 text-gray-300" />
                                  )}
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-gray-800">
                                    {prod.name}
                                  </h5>
                                  <span className="text-[11px] text-gray-500">
                                    {prod.price.toFixed(2).replace('.', ',')}€
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          );
                        })
                      )
                    ) : filteredMenus.length === 0 ? (
                      <p className="p-6 text-center text-xs text-gray-400">
                        {t("common.noResults", "No se encontraron menús.")}
                      </p>
                    ) : (
                      filteredMenus.map((menu) => {
                        const isSelected = formData.targets.some(
                          (t) => t.id === menu.id && t.type === "menu"
                        );
                        const img = formatImageUrl(menu.imgUrl, driverApiUrl);

                        return (
                          <div
                            key={menu.id}
                            onClick={() =>
                              handleToggleTarget(menu, "menu")
                            }
                            className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-gray-100 hover:bg-gray-150"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {img ? (
                                  <img
                                    src={img}
                                    alt={menu.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Layers className="w-5 h-5 text-gray-300" />
                                )}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-gray-800">
                                  {menu.name}
                                </h5>
                                <span className="text-[11px] text-gray-500">
                                  {menu.price.toFixed(2).replace('.', ',')}€
                                </span>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-black border-black text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ── Time & Schedule Tab ── */}
              {modalTab === "time" && (
                <div className="space-y-5">
                  {/* Card 1: Expiration & Date Range */}
                  <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-700">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">
                            {t("webAdmin.offers.scheduleValidityTitle", "Vigencia y Fecha de Expiración")}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            {t(
                              "webAdmin.offers.scheduleValiditySubtitle",
                              "Configura cuándo inicia la oferta y cuándo expira automáticamente"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-700">
                          {formData.schedule.hasDateRange
                            ? t("webAdmin.offers.scheduleScheduled", "Con límite")
                            : t("webAdmin.offers.scheduleNoExpiration", "Sin expiración")}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              schedule: {
                                ...prev.schedule,
                                hasDateRange: !prev.schedule.hasDateRange,
                              },
                            }))
                          }
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                            formData.schedule.hasDateRange ? "bg-emerald-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              formData.schedule.hasDateRange ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {formData.schedule.hasDateRange ? (
                      <div className="pt-2 border-t border-gray-200/80 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-gray-700">
                              {t("webAdmin.offers.scheduleDateRange", "Rango de fechas")} <span className="text-red-500">*</span>
                            </label>
                            {(formData.schedule.startDate || formData.schedule.endDate) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    schedule: {
                                      ...prev.schedule,
                                      startDate: "",
                                      endDate: "",
                                    },
                                  }))
                                }
                                className="text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer transition-colors"
                              >
                                {t("webAdmin.offers.clearDates", "Borrar fechas")}
                              </button>
                            )}
                          </div>

                          <DateRangePicker
                            startDate={formData.schedule.startDate ? new Date(formData.schedule.startDate) : null}
                            endDate={formData.schedule.endDate ? new Date(formData.schedule.endDate) : null}
                            onChange={(start, end) => {
                              setFormData((prev) => {
                                const currentStartTime =
                                  prev.schedule.startDate && prev.schedule.startDate.includes("T")
                                    ? prev.schedule.startDate.split("T")[1].substring(0, 5)
                                    : "00:00";
                                const currentEndTime =
                                  prev.schedule.endDate && prev.schedule.endDate.includes("T")
                                    ? prev.schedule.endDate.split("T")[1].substring(0, 5)
                                    : "23:59";
                                return {
                                  ...prev,
                                  schedule: {
                                    ...prev.schedule,
                                    startDate: start ? `${dayjs(start).format("YYYY-MM-DD")}T${currentStartTime}:00` : "",
                                    endDate: end ? `${dayjs(end).format("YYYY-MM-DD")}T${currentEndTime}:00` : "",
                                  },
                                };
                              });
                            }}
                          />
                        </div>

                        {/* Start & Expiration Time Pickers */}
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                                {t("webAdmin.offers.scheduleStartTime", "Hora de inicio")}
                              </label>
                              <MobileTimePicker
                                value={
                                  formData.schedule.startDate
                                    ? dayjs(formData.schedule.startDate)
                                    : dayjs("2000-01-01T00:00:00")
                                }
                                onChange={(newValue: Dayjs | null) => {
                                  if (newValue && newValue.isValid()) {
                                    const timeStr = newValue.format("HH:mm:00");
                                    setFormData((prev) => {
                                      const baseDate = prev.schedule.startDate
                                        ? dayjs(prev.schedule.startDate).format("YYYY-MM-DD")
                                        : dayjs().format("YYYY-MM-DD");
                                      return {
                                        ...prev,
                                        schedule: {
                                          ...prev.schedule,
                                          startDate: `${baseDate}T${timeStr}`,
                                        },
                                      };
                                    });
                                  }
                                }}
                                views={["hours", "minutes"]}
                                ampm={false}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                    sx: {
                                      backgroundColor: "#ffffff",
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        "&:hover .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#10b981",
                                        },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#059669",
                                          borderWidth: "1.5px",
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                              <p className="text-[10px] text-gray-500 mt-1">
                                {t("webAdmin.offers.scheduleStartDateHint", "Dejar vacío para iniciar de inmediato")}
                              </p>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                                {t("webAdmin.offers.scheduleExpirationTime", "Hora de expiración")} <span className="text-red-500">*</span>
                              </label>
                              <MobileTimePicker
                                value={
                                  formData.schedule.endDate
                                    ? dayjs(formData.schedule.endDate)
                                    : dayjs("2000-01-01T23:59:00")
                                }
                                onChange={(newValue: Dayjs | null) => {
                                  if (newValue && newValue.isValid()) {
                                    const timeStr = newValue.format("HH:mm:00");
                                    setFormData((prev) => {
                                      const baseDate = prev.schedule.endDate
                                        ? dayjs(prev.schedule.endDate).format("YYYY-MM-DD")
                                        : dayjs().add(7, "day").format("YYYY-MM-DD");
                                      return {
                                        ...prev,
                                        schedule: {
                                          ...prev.schedule,
                                          endDate: `${baseDate}T${timeStr}`,
                                        },
                                      };
                                    });
                                  }
                                }}
                                views={["hours", "minutes"]}
                                ampm={false}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                    sx: {
                                      backgroundColor: "#ffffff",
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        "&:hover .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#10b981",
                                        },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#059669",
                                          borderWidth: "1.5px",
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                              <p className="text-[10px] text-gray-500 mt-1">
                                {t(
                                  "webAdmin.offers.scheduleEndDateHint",
                                  "La oferta desaparecerá automáticamente tras esta fecha y hora"
                                )}
                              </p>
                            </div>
                          </div>
                        </LocalizationProvider>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>
                          {t(
                            "webAdmin.offers.scheduleNoExpirationNotice",
                            "Esta oferta estará activa indefinidamente mientras su estado sea 'Activa'."
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Days of the week */}
                  <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-700">
                          <CalendarDays className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">
                            {t("webAdmin.offers.scheduleDaysTitle", "Días de la Semana")}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            {t(
                              "webAdmin.offers.scheduleDaysSubtitle",
                              "Selecciona si la oferta se aplica todos los días o días específicos"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Mode toggle */}
                      <div className="flex bg-gray-200 p-0.5 rounded-lg text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              schedule: {
                                ...prev.schedule,
                                allDays: true,
                              },
                            }))
                          }
                          className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                            formData.schedule.allDays
                              ? "bg-white text-gray-900 shadow-2xs"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          {t("webAdmin.offers.scheduleAllWeek", "Toda la semana")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              schedule: {
                                ...prev.schedule,
                                allDays: false,
                              },
                            }))
                          }
                          className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                            !formData.schedule.allDays
                              ? "bg-white text-gray-900 shadow-2xs"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          {t("webAdmin.offers.scheduleSpecificDays", "Días específicos")}
                        </button>
                      </div>
                    </div>

                    {!formData.schedule.allDays && (
                      <div className="pt-2 border-t border-gray-200/80 space-y-3">
                        {/* Day presets */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            {t("webAdmin.offers.schedulePresets", "Preajustes:")}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                schedule: {
                                  ...prev.schedule,
                                  days: [1, 2, 3, 4, 5],
                                },
                              }))
                            }
                            className="px-2.5 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            {t("webAdmin.offers.scheduleMonFri", "Lun - Vie")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                schedule: {
                                  ...prev.schedule,
                                  days: [6, 0],
                                },
                              }))
                            }
                            className="px-2.5 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            {t("webAdmin.offers.scheduleWeekends", "Fin de semana")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                schedule: {
                                  ...prev.schedule,
                                  days: [1, 2, 3, 4, 5, 6, 0],
                                },
                              }))
                            }
                            className="px-2.5 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            {t("webAdmin.offers.scheduleAll7Days", "Los 7 días")}
                          </button>
                        </div>

                        {/* 7 day buttons */}
                        <div className="grid grid-cols-7 gap-2">
                          {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                            const isSelected = formData.schedule.days.includes(dayNum);
                            return (
                              <button
                                key={dayNum}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => {
                                    const curr = prev.schedule.days || [];
                                    const next = curr.includes(dayNum)
                                      ? curr.filter((d) => d !== dayNum)
                                      : [...curr, dayNum];
                                    return {
                                      ...prev,
                                      schedule: {
                                        ...prev.schedule,
                                        days: next,
                                      },
                                    };
                                  });
                                }}
                                title={t(`webAdmin.offers.fullDays.${dayNum}`)}
                                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                                  isSelected
                                    ? "bg-black text-white shadow-xs"
                                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                <span>{t(`webAdmin.offers.days.${dayNum}`)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Time Range / Specific hours (e.g. Midnight) */}
                  <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-700">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">
                            {t("webAdmin.offers.scheduleTimeTitle", "Franja Horaria del Día")}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            {t(
                              "webAdmin.offers.scheduleTimeSubtitle",
                              "Ejecutar a medianoche, durante el almuerzo o en horas específicas"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-700">
                          {formData.schedule.hasTimeRange
                            ? t("webAdmin.offers.scheduleSpecificHours", "Franja horaria")
                            : t("webAdmin.offers.scheduleAllDay24h", "Todo el día (24h)")}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              schedule: {
                                ...prev.schedule,
                                hasTimeRange: !prev.schedule.hasTimeRange,
                              },
                            }))
                          }
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                            formData.schedule.hasTimeRange ? "bg-emerald-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              formData.schedule.hasTimeRange ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {formData.schedule.hasTimeRange ? (
                      <div className="pt-2 border-t border-gray-200/80 space-y-3">
                        {/* Time presets */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            {t("webAdmin.offers.schedulePresets", "Preajustes:")}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                schedule: {
                                  ...prev.schedule,
                                  startTime: "00:00",
                                  endTime: "04:00",
                                },
                              }))
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 hover:bg-gray-100 hover:border-emerald-500 cursor-pointer transition-colors"
                          >
                            <Moon className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{t("webAdmin.offers.schedulePresetMidnight", "Medianoche (00:00 - 04:00)")}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                schedule: {
                                  ...prev.schedule,
                                  startTime: "12:00",
                                  endTime: "16:00",
                                },
                              }))
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 hover:bg-gray-100 hover:border-emerald-500 cursor-pointer transition-colors"
                          >
                            <Utensils className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{t("webAdmin.offers.schedulePresetLunch", "Almuerzo (12:00 - 16:00)")}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                schedule: {
                                  ...prev.schedule,
                                  startTime: "20:00",
                                  endTime: "23:59",
                                },
                              }))
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 hover:bg-gray-100 hover:border-emerald-500 cursor-pointer transition-colors"
                          >
                            <Wine className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{t("webAdmin.offers.schedulePresetDinner", "Cena (20:00 - 23:59)")}</span>
                          </button>
                        </div>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                                {t("webAdmin.offers.scheduleStartTime", "Desde (Hora de inicio)")}
                              </label>
                              <MobileTimePicker
                                value={
                                  formData.schedule.startTime
                                    ? dayjs(`2000-01-01T${formData.schedule.startTime}:00`)
                                    : dayjs("2000-01-01T00:00:00")
                                }
                                onChange={(newValue: Dayjs | null) => {
                                  if (newValue && newValue.isValid()) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      schedule: {
                                        ...prev.schedule,
                                        startTime: newValue.format("HH:mm"),
                                      },
                                    }));
                                  }
                                }}
                                views={["hours", "minutes"]}
                                ampm={false}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                    sx: {
                                      backgroundColor: "#ffffff",
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        "&:hover .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#10b981",
                                        },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#059669",
                                          borderWidth: "1.5px",
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                                {t("webAdmin.offers.scheduleEndTime", "Hasta (Hora de fin)")}
                              </label>
                              <MobileTimePicker
                                value={
                                  formData.schedule.endTime
                                    ? dayjs(`2000-01-01T${formData.schedule.endTime}:00`)
                                    : dayjs("2000-01-01T23:59:00")
                                }
                                onChange={(newValue: Dayjs | null) => {
                                  if (newValue && newValue.isValid()) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      schedule: {
                                        ...prev.schedule,
                                        endTime: newValue.format("HH:mm"),
                                      },
                                    }));
                                  }
                                }}
                                views={["hours", "minutes"]}
                                ampm={false}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                    sx: {
                                      backgroundColor: "#ffffff",
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                        "&:hover .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#10b981",
                                        },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#059669",
                                          borderWidth: "1.5px",
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>
                        </LocalizationProvider>

                        {formData.schedule.startTime && formData.schedule.endTime && formData.schedule.startTime > formData.schedule.endTime && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>
                              {t(
                                "webAdmin.offers.scheduleCrossMidnightWarning",
                                "Esta franja cruza la medianoche (activa desde la noche hasta la madrugada del día siguiente)."
                              )}
                            </span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>
                          {t(
                            "webAdmin.offers.scheduleAllDayNotice",
                            "Activa durante todo el día (24 horas) en los días programados."
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
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
                onClick={handleApplyModal}
                disabled={compressing}
                label={t("webAdmin.common.save")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersTab;
