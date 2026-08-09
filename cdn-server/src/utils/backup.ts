import path from "path";
import fs from "fs";
import winston from "winston";

/**
 * Prunes a backup directory using a two-tier retention policy:
 *
 *  Tier 1 – recent window  : keep the `keep` most-recent files created today.
 *  Tier 2 – previous days  : for each of the `prevDays` calendar days before
 *                            today, keep the single most-recent file from that
 *                            day (regardless of what time it was created).
 *
 * Everything else is deleted.
 *
 * @param dir       Absolute path to the backup directory.
 * @param prefix    Filename prefix used to identify backup files (e.g. "db_snapshot_").
 * @param keep      Number of recent files (today only) to retain.
 * @param logger    Winston logger instance for status/error messages.
 * @param prevDays  Number of previous calendar days to retain one backup for.
 *                  Pass 0 (default) to use count-only behaviour.
 */
export async function pruneOldBackups(
  dir: string,
  prefix: string,
  keep: number,
  logger: winston.Logger,
  prevDays: number = 0
): Promise<void> {
  try {
    const files = await fs.promises.readdir(dir);
    const matching = files.filter((f) => f.startsWith(prefix));

    const withStats = await Promise.all(
      matching.map(async (f) => {
        const fullPath = path.join(dir, f);
        const stat = await fs.promises.stat(fullPath);
        return { name: f, fullPath, mtime: stat.mtime };
      })
    );

    // Sort newest → oldest
    withStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // ── Tier 1: the N most-recent files from today ────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayFiles = withStats.filter((f) => f.mtime >= todayStart);
    const recentSet = new Set(todayFiles.slice(0, keep).map((f) => f.fullPath));

    // ── Tier 2: one file per previous calendar day ────────────────────────────
    const dailySet = new Set<string>();

    if (prevDays > 0) {
      for (let d = 1; d <= prevDays; d++) {
        const dayStart = new Date(todayStart.getTime() - d * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(todayStart.getTime() - (d - 1) * 24 * 60 * 60 * 1000 - 1);

        // withStats is sorted newest → oldest, so the first match is the
        // most-recent backup created on that calendar day.
        const latest = withStats.find(
          (f) => f.mtime >= dayStart && f.mtime <= dayEnd
        );

        if (latest) {
          dailySet.add(latest.fullPath);
          logger.info(`Retaining previous-day backup (day -${d}): ${latest.name}`);
        }
      }
    }

    // ── Delete anything not in either tier ────────────────────────────────────
    const toDelete = withStats.filter(
      (f) => !recentSet.has(f.fullPath) && !dailySet.has(f.fullPath)
    );

    if (toDelete.length === 0) {
      logger.info(`No old backups to prune in ${dir}`);
      return;
    }

    for (const f of toDelete) {
      await fs.promises.unlink(f.fullPath);
      logger.info(`Pruned old backup: ${f.name}`);
    }
  } catch (err) {
    logger.error(`Error pruning backups in ${dir}: ${(err as Error).message}`);
  }
}
