import { spawn } from "child_process";
import winston from "winston";

const SYNC_SCRIPT = "C:\\sync-images.ps1";

/**
 * Fires a PowerShell image-sync script as a fire-and-forget process.
 * Logs only on completion or failure.
 *
 * @param logger  Winston logger to record sync results.
 */
export function triggerImageSync(logger: winston.Logger): void {
  const proc = spawn(
    "powershell.exe",
    ["-NonInteractive", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", SYNC_SCRIPT],
    { stdio: "ignore" }
  );

  proc.on("close", (code) => {
    if (code === 0) {
      logger.info("[image-sync] Completed successfully");
    } else {
      logger.error(`[image-sync] Failed with exit code ${code}`);
    }
  });

  proc.on("error", (err) => {
    logger.error(`[image-sync] Failed to spawn process: ${err.message}`);
  });
}
