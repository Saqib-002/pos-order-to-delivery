import { TOAST_DEBOUNCE_MS } from "@/constants";
import { debounce } from "lodash";
import { toast } from "react-toastify";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const showToast = {
  success: debounce(
    (message: string) => toast.success(message),
    TOAST_DEBOUNCE_MS
  ),
  error: debounce((message: string) => toast.error(message), TOAST_DEBOUNCE_MS),
};
export const formatAddress = (address: string) => {
  if (!address || !address.trim()) return "";

  if (address.includes("|") && address.includes("=")) {
    const parts = address.split("|");
    const addressObj: Record<string, string> = {};

    parts.forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        addressObj[key] = value;
      }
    });

    const formattedParts: string[] = [];

    if (addressObj.address) {
      formattedParts.push(addressObj.address);
    }

    if (addressObj.apartment) {
      formattedParts.push(addressObj.apartment);
    }

    const locationParts: string[] = [];
    if (addressObj.postal) {
      locationParts.push(addressObj.postal);
    }
    if (addressObj.city) {
      locationParts.push(addressObj.city);
    }
    if (addressObj.province) {
      locationParts.push(addressObj.province);
    }

    if (locationParts.length > 0) {
      formattedParts.push(locationParts.join(" "));
    }

    return formattedParts.join(", ");
  }

  return address;
};

const parseStructuredAddress = (address: string) => {
  const addressObj: Record<string, string> = {};
  address.split("|").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) addressObj[key] = value;
  });
  return addressObj;
};

// A comma-separated part that is flat/door details or a delivery note rather
// than location, e.g. "portal 2", "escalera izq", "piso 3", "timbre roto".
// The negative lookahead stops prefixes of real words ("local" ≠ "localidad").
const EXTRA_ADDRESS_PART =
  /^(portal|ptal|escalera|esc|piso|planta|pl(?=\.?\s*\d)|puerta|pta|bloque|blq|timbre|llamar|interfono|portero|bajo|ático|atico|entresuelo|izquierda|izq|izda|derecha|dcha|dcho|local|apto|apartamento)(?![a-záéíóúñü])/i;
// A part that is only a floor/door, e.g. "3ºB", "1ª", "2º izq"
const FLOOR_DOOR_PART = /^\d+\s*[ºª°]\s*[a-z]?\.?(\s*(izquierda|izq|izda|derecha|dcha)\.?)?$/i;
// A floor/door stuck to the end of the street part: "Calle Luna 3 2ºB"
// (only at the end, so street names like "Calle 1º de Mayo 5" are untouched)
const TRAILING_FLOOR_DOOR = /\s+\d+\s*[ºª°]\s*[a-z]?\.?$/i;

// Removes flat details and notes that make geocoders find nothing, e.g.
// "Calle Lago Ontario 3, portal 2, escalera izq, 3ºB, timbre roto, Rivas"
// -> "Calle Lago Ontario 3, Rivas". The first part (the street) is never
// dropped, so "Pl. Mayor" (Plaza) stays intact.
export const stripAddressExtras = (text: string) => {
  const parts = text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  const [street, ...rest] = parts;
  const kept = rest.filter(
    (p) => !EXTRA_ADDRESS_PART.test(p) && !FLOOR_DOOR_PART.test(p)
  );
  return [street.replace(TRAILING_FLOOR_DOOR, ""), ...kept].join(", ");
};

// Address text sent to geocoders: like formatAddress but without the
// apartment (floor/door) and other flat details, which geocoders can't match
// and which don't change the building's location. Only used for the lookup —
// the address shown to staff and drivers is unchanged.
export const formatAddressForGeocoding = (address: string) => {
  if (!address || !address.trim()) return "";
  if (!(address.includes("|") && address.includes("="))) {
    return stripAddressExtras(address);
  }

  const addressObj = parseStructuredAddress(address);
  const location = [addressObj.postal, addressObj.city, addressObj.province]
    .filter(Boolean)
    .join(" ");
  const street = addressObj.address ? stripAddressExtras(addressObj.address) : "";
  return [street, location].filter(Boolean).join(", ");
};

// Spanish 5-digit postcode of an order address, if present
export const extractPostcode = (address: string): string | null => {
  if (!address) return null;
  if (address.includes("|") && address.includes("=")) {
    const postal = parseStructuredAddress(address).postal?.trim();
    if (postal && /^\d{5}$/.test(postal)) return postal;
  }
  const match = formatAddress(address).match(/\b(\d{5})\b/);
  return match ? match[1] : null;
};

export const colorOptions = [
  { value: "red", label: "Red", color: "bg-red-500" },
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
  { value: "pink", label: "Pink", color: "bg-pink-500" },
  { value: "indigo", label: "Indigo", color: "bg-indigo-500" },
  { value: "yellow", label: "Yellow", color: "bg-yellow-500" },
  { value: "gray", label: "Gray", color: "bg-gray-500" },
];
export const calculateBaseProductPrice = (product: any) => {
  const productTaxRate = (product.tax || 0) / 100;
  return (product.price || 0) / (1 + productTaxRate);
};

export const calculateProductTaxAmount = (product: any) => {
  const productTaxRate = (product.tax || 0) / 100;
  const price = product.price || 0;
  return price - price / (1 + productTaxRate);
};

export const getOrderDisplayNumber = (
  order: { ticketNumber?: string | null; orderId?: number | string | null; orderType?: string | null },
  defaultPrefix: string = "K"
): string => {
  if (order.ticketNumber && order.ticketNumber.trim()) {
    return order.ticketNumber.trim();
  }
  const orderType = (order.orderType || "").toLowerCase();
  let prefix = defaultPrefix;
  if (orderType.startsWith("platform")) {
    prefix = "P";
  } else if (orderType.startsWith("web")) {
    prefix = "W";
  } else if (orderType.startsWith("app")) {
    prefix = "A";
  }
  return `${prefix}${order.orderId ?? ""}`;
};

export const getCustomerDisplayName = (
  order?: {
    customer?: { name?: string | null } | null;
    customerName?: string | null;
    platformName?: string | null;
    platformId?: string | null;
    platform?: string | null;
    orderType?: string | null;
    items?: Array<{ productName?: string | null }>;
  } | null,
  platforms?: Array<{ id: string | number; name?: string }>
): string => {
  if (!order) return "-";

  const rawCustomerName = (
    order.customer?.name ||
    (order as any).customerName ||
    ""
  ).trim();

  // Try to determine platform name
  let platformName = (
    order.platformName ||
    (order as any).platform ||
    ""
  ).trim();

  const platformId = (order as any).platformId || order.platformId;
  if (!platformName && platformId && platforms && platforms.length > 0) {
    const found = platforms.find(
      (p) => String(p.id).toLowerCase() === String(platformId).toLowerCase()
    );
    if (found?.name) {
      platformName = found.name.trim();
    }
  }

  // Fallback: extract platform name from order items if it was created like "Glovo Order"
  if (!platformName && order.items && order.items.length > 0) {
    for (const item of order.items) {
      if (item.productName && /order$/i.test(item.productName.trim())) {
        const extracted = item.productName.replace(/\s+order$/i, "").trim();
        if (extracted && extracted.toLowerCase() !== "platform") {
          platformName = extracted;
          break;
        }
      }
    }
  }

  const lowerRaw = rawCustomerName.toLowerCase();
  const isGenericCustomer =
    !rawCustomerName ||
    lowerRaw === "platform customer" ||
    lowerRaw === "cliente de plataforma" ||
    lowerRaw === "platform_customer" ||
    lowerRaw === "platformcustomer";

  const isPlatformOrder =
    Boolean(platformName) ||
    Boolean(platformId) ||
    (order.orderType ? order.orderType.toLowerCase().includes("platform") : false);

  if (isPlatformOrder) {
    // If no name (or generic "Platform Customer"), show the platform name instead
    if (isGenericCustomer) {
      return platformName || rawCustomerName || "-";
    }
    // If name exists, show both: Customer Name (Platform Name)
    if (platformName) {
      if (lowerRaw.includes(platformName.toLowerCase())) {
        return rawCustomerName;
      }
      return `${rawCustomerName} (${platformName})`;
    }
    return rawCustomerName;
  }

  // Non-platform orders
  if (isGenericCustomer) {
    return platformName || "-";
  }

  return rawCustomerName || "-";
};
