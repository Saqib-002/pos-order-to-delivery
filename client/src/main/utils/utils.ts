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
    const response = await fetch(`${uploadUrl}/upload`, {
        method: "POST",
        body: formData,
    });
    if (!response.ok) {
        return "";
    }
    const data = await response.json();
    return data.url;
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