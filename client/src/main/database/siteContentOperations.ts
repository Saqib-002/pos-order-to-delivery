import Store from "electron-store";
import { syncSiteContentToVPS } from "../utils/sync/siteContent.js";
import { uploadImg } from "../utils/utils.js";
import Logger from "electron-log";

const siteContentStore = new Store({ name: "site-content" });

export class SiteContentOperations {
  /**
   * Get all cached site content or a specific key
   */
  static async getSiteContent(key?: string) {
    try {
      if (key) {
        return (siteContentStore as any).get(key) ?? null;
      }
      return (siteContentStore as any).store ?? {};
    } catch (error) {
      Logger.error("SiteContentOperations: Error reading local store:", error);
      return {};
    }
  }

  /**
   * Save content locally and enqueue for VPS sync
   */
  static async saveSiteContent(key: string, value: any) {
    try {
      const processedValue = JSON.parse(JSON.stringify(value || {}));

      // Automatically upload base64 images to CDN / driver API uploads folder
      if (key === "hero" && Array.isArray(processedValue.slides)) {
        for (const slide of processedValue.slides) {
          if (slide.image && typeof slide.image === "string" && slide.image.startsWith("data:")) {
            slide.image = await uploadImg(slide.image, false);
          }
        }
      } else if (key === "about" && processedValue.imageUrl && typeof processedValue.imageUrl === "string" && processedValue.imageUrl.startsWith("data:")) {
        processedValue.imageUrl = await uploadImg(processedValue.imageUrl, false);
      } else if (key === "branding" && processedValue.logoUrl && typeof processedValue.logoUrl === "string" && processedValue.logoUrl.startsWith("data:")) {
        processedValue.logoUrl = await uploadImg(processedValue.logoUrl, false);
      }

      (siteContentStore as any).set(key, processedValue);
      await syncSiteContentToVPS(key, processedValue);
      return { success: true, key, value: processedValue };
    } catch (error) {
      Logger.error(`SiteContentOperations: Error saving key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Fetch remote content from Cloud VPS and cache locally
   */
  static async fetchRemoteSiteContent() {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    try {
      const response = await fetch(`${vpsUrl}/api/v1/content`);
      if (!response.ok) {
        Logger.warn(`SiteContentOperations: remote fetch failed — ${response.status}`);
        return (siteContentStore as any).store ?? {};
      }
      const data = await response.json();
      if (data && typeof data === "object") {
        for (const [k, v] of Object.entries(data)) {
          (siteContentStore as any).set(k, v);
        }
      }
      return (siteContentStore as any).store ?? {};
    } catch (error) {
      Logger.error("SiteContentOperations: Network error fetching remote content:", error);
      return (siteContentStore as any).store ?? {};
    }
  }
}
