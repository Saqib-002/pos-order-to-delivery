import Store from "electron-store";

const store = new Store();

export const uploadImg = async (
    base64Logo: string,
    isLogo: boolean
): Promise<string> => {
    const matches = base64Logo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 string");
    }
    const [, mimeType, base64Data] = matches;
    const buffer = Buffer.from(base64Data, "base64");
    const formData = new FormData();
    const ext = mimeType.split("/")[1];
    const blob = new Blob([buffer], { type: mimeType });
    formData.append("file", blob, `${isLogo ? "logo" : "uuid"}.${ext}`);
    const uploadUrl = (store as any).get("cdnUrl") as string;
    if (!uploadUrl) {
        throw new Error("CDN_URL is not set in configurations");
    }

    let response: Response;
    try {
        response = await fetch(`${uploadUrl}/upload`, {
            method: "POST",
            body: formData,
        });
    } catch {
        throw new Error(`Cannot reach CDN server at ${uploadUrl}. Make sure the CDN server is running.`);
    }

    if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(`CDN upload failed (${response.status}): ${text}`);
    }
    const data = await response.json();
    return data.url;
};

/**
 * Upload a base64-encoded image directly to the driver-server VPS
 * (POST /api/v1/content/upload-image), the same endpoint used by
 * the web admin (alidoner-kebab-admin).
 *
 * Returns the server-relative URL, e.g. "/images/abc123.png".
 * Throws a descriptive error on network failure or non-2xx response.
 */
export const uploadImgToServer = async (
    base64Image: string,
    isLogo: boolean = false,
): Promise<string> => {
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 string");
    }
    const [, mimeType, base64Data] = matches;
    const buffer = Buffer.from(base64Data, "base64");
    const ext = mimeType.split("/")[1];
    const blob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append("file", blob, `${isLogo ? "logo" : "image"}.${ext}`);

    const vpsUrl = process.env.DRIVER_API_URL || "https://api.bbven.es";
    const secret = process.env.DRIVER_SYNC_SECRET || "";

    // Build URL — pass ?type=logo so the server uses a stable "logo.<ext>" filename
    const qs = isLogo ? "?type=logo" : "";
    const url = `${vpsUrl}/api/v1/content/upload-image${qs}`;

    let response: Response;
    try {
        response = await fetch(url, {
            method: "POST",
            headers: {
                // POS_SYNC_SECRET is accepted as a Bearer token by adminAuthMiddleware
                Authorization: `Bearer ${secret}`,
                // Do NOT set Content-Type — the browser/node must set the multipart boundary
            },
            body: formData,
        });
    } catch {
        throw new Error(`Cannot reach driver server at ${vpsUrl}. Check your internet connection.`);
    }

    if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(`Server image upload failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.url as string; // e.g. "/images/abc123.png"
};
export const deleteImg = async (filename: string | null | undefined) => {
    if (!filename) {
        return false;
    }
    if (filename.startsWith("http")) {
        return false;
    }
    const cdnUrl = (store as any).get("cdnUrl") as string;
    if (!cdnUrl) {
        return false;
    }

    try {
        const deleteUrl = `${cdnUrl}/delete/${filename}`;
        await fetch(deleteUrl, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });
        return true;
    } catch (error: any) {
        return false;
    }
};