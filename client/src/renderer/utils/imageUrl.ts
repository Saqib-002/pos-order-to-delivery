/**
 * Formats an image path/filename into a full URL using the Driver API / CDN base URL.
 * Matches: ${driverApiUrl}/uploads/${fileName}
 */
export function formatImageUrl(
  imagePath?: string | null,
  baseUrl?: string
): string {
  if (!imagePath || imagePath.trim() === "") return "";
  const trimmed = imagePath.trim();

  // If already a base64 Data URL or Blob URL, display directly
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // If absolute HTTP/HTTPS URL, display directly
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const envUrl =
    (import.meta as any).env?.VITE_DRIVER_API_URL?.replace(/\/api\/?$/, "") ||
    (import.meta as any).env?.DRIVER_API_URL ||
    "https://api.bbven.es";

  const base = (baseUrl || envUrl).replace(/\/+$/, "");
  const cleanPath = trimmed.replace(/^\/+/, "");
  return `${base}/${cleanPath}`;
}
