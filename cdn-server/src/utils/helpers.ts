import { networkInterfaces } from "os";

/** Zero-pads a number to at least 2 digits. */
export function pad(num: number): string {
  return num.toString().padStart(2, "0");
}

/**
 * Builds a filesystem-safe timestamp string.
 * Format: YYYY-MM-DDThh-mm-ss
 */
export function buildTimestamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d}T${h}-${mi}-${s}`;
}

/** Returns the first non-internal IPv4 address, or "localhost" as fallback. */
export function getLocalNetworkIp(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}
