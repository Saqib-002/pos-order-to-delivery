/**
 * Lightweight online check.
 * Sends a HEAD request to the VPS /health endpoint with a 5-second
 * timeout. Returns true only when we get any HTTP response — we do
 * not care about the status code, only that the network is reachable.
 */
export async function isOnline(): Promise<boolean> {
    const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${vpsUrl}/health`, {
            method: "HEAD",
            signal: controller.signal,
        });

        clearTimeout(timeout);
        return response.ok;
    } catch {
        return false;
    }
}
