import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import cron from "node-cron";
import archiver from "archiver";
import { networkInterfaces } from "os";
import dotenv from "dotenv";
import winston from "winston";

dotenv.config();

// ─────────────────────────────────────────────
//  Paths & constants
// ─────────────────────────────────────────────
const PORT = 3001;
const UPLOAD_DIR = path.join(__dirname, "../uploads");
const BACKUP_BASE_DIR = "C:\\backups";
const DB_BACKUP_DIR = path.join(BACKUP_BASE_DIR, "db");       // plain .sql files
const IMG_BACKUP_DIR = path.join(BACKUP_BASE_DIR, "images");  // zipped image snapshots
const LOG_DIR = path.join(__dirname, "../logs");

const DB_USER = process.env.DB_USER || "your_postgres_user";
const DB_PASSWORD = process.env.DB_PASSWORD || "your_postgres_password";
const DB_NAME = process.env.DB_NAME || "your_database_name";
const DB_HOST = process.env.DB_HOST || "localhost";

// How many old backups to retain in each directory
const MAX_DB_BACKUPS_TO_KEEP = 8;    // 8 × 30 min = last 4 h
const MAX_IMG_BACKUPS_TO_KEEP = 1;   // last 1 daily zips

// Also keep the single most-recent DB backup from each of the previous N calendar days
const DB_PREV_DAYS_TO_KEEP = 2;
const IMG_PREV_DAYS_TO_KEEP = 2;

// ─────────────────────────────────────────────
//  Ensure directories exist
// ─────────────────────────────────────────────
for (const dir of [UPLOAD_DIR, DB_BACKUP_DIR, IMG_BACKUP_DIR, LOG_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ─────────────────────────────────────────────
//  Loggers
// ─────────────────────────────────────────────
function makeLogger(filename: string) {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, message }) =>
        `[${timestamp}] [${level.toUpperCase()}] ${message}`
      )
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(LOG_DIR, filename),
        maxsize: 1 * 1024 * 1024,  // 5 MB per file
        maxFiles: 2,                // keep up to 5 rotated files
        tailable: true,
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message }) =>
            `[${filename.replace(".log", "")}] [${level}] ${message}`
          )
        ),
      }),
    ],
  });
}

/** Logs for DB backup jobs */
const dbBackupLogger = makeLogger("db-backup.log");

/** Logs for image backup jobs */
const imgBackupLogger = makeLogger("images-backup.log");

/** General server logs (requests, startup, errors, etc.) */
const serverLogger = makeLogger("server.log");

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function pad(num: number) {
  return num.toString().padStart(2, "0");
}

function buildTimestamp(date: Date = new Date()) {
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d}T${h}-${mi}-${s}`;
}

function getLocalNetworkIp() {
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

/**
 * Prune a backup directory using a two-tier retention policy:
 *
 *  Tier 1 – recent window  : keep the `keep` most-recent files (e.g. last 4 h)
 *  Tier 2 – previous days  : for each of the `prevDays` calendar days before
 *                            today, keep the single most-recent file from that
 *                            day (regardless of what time it was created).
 *
 * Everything else is deleted.
 *
 * @param prevDays  Number of previous calendar days to retain one backup for.
 *                  Pass 0 (default) to use the original count-only behaviour.
 */
async function pruneOldBackups(
  dir: string,
  prefix: string,
  keep: number,
  logger: winston.Logger,
  prevDays: number = 0
) {
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

    // ── Tier 1: the N most-recent files from today only ───────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayFiles = withStats.filter((f) => f.mtime >= todayStart);
    const recentSet = new Set(todayFiles.slice(0, keep).map((f) => f.fullPath));

    // ── Tier 2: one file per previous calendar day ────────────────────────────
    const dailySet = new Set<string>();

    if (prevDays > 0) {
      const today = todayStart;

      for (let d = 1; d <= prevDays; d++) {
        const dayStart = new Date(today.getTime() - d * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(today.getTime() - (d - 1) * 24 * 60 * 60 * 1000 - 1);

        // withStats is already sorted newest → oldest, so the first match is
        // the most-recent backup that was created on that calendar day.
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

// ─────────────────────────────────────────────
//  DB backup  (runs every 30 minutes)
//  Output: C:\backups\db\db_snapshot_<timestamp>.sql
// ─────────────────────────────────────────────
async function runDbBackup() {
  const timestamp = buildTimestamp();
  // .dump extension reflects pg_dump custom format (-F c), which is a binary
  // format that preserves everything (tables, sequences, indexes, triggers,
  // constraints, large objects, extensions, etc.) and is restored with pg_restore.
  const filename = `db_snapshot_${timestamp}.dump`;
  const outPath = path.join(DB_BACKUP_DIR, filename);

  dbBackupLogger.info(`Starting DB backup → ${filename}`);

  // -F c  : custom (binary) format — complete, compressed, restorable with pg_restore
  // -b    : include large objects / BLOBs
  // -v    : verbose output (sent to stderr by pg_dump, logged below)
  // PGPASSWORD env var supplies the password — no interactive prompt needed
  const dumpCommand = `pg_dump -U ${DB_USER} -h ${DB_HOST} -d ${DB_NAME} -F c -b -v -f "${outPath}"`;

  try {
    await new Promise<void>((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
      exec(dumpCommand, { env }, (error, _stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        // pg_dump writes its verbose progress to stderr — that is normal, not an error
        if (stderr) {
          dbBackupLogger.info(`pg_dump output: ${stderr.trim()}`);
        }
        resolve();
      });
    });

    dbBackupLogger.info(`DB backup completed: ${filename}`);
    await pruneOldBackups(DB_BACKUP_DIR, "db_snapshot_", MAX_DB_BACKUPS_TO_KEEP, dbBackupLogger, DB_PREV_DAYS_TO_KEEP);
  } catch (err) {
    dbBackupLogger.error(`DB backup failed: ${(err as Error).message}`);
    throw err;
  }
}

// ─────────────────────────────────────────────
//  Images backup  (runs once per day)
//  Output: C:\backups\images\images_backup_<timestamp>.zip
// ─────────────────────────────────────────────
async function runImagesBackup() {
  const timestamp = buildTimestamp();
  const zipFilename = `images_backup_${timestamp}.zip`;
  const zipPath = path.join(IMG_BACKUP_DIR, zipFilename);

  imgBackupLogger.info(`Starting images backup → ${zipFilename}`);

  try {
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        imgBackupLogger.info(
          `Images backup completed: ${zipFilename} (${archive.pointer()} bytes)`
        );
        resolve();
      });

      archive.on("warning", (warn) => {
        imgBackupLogger.warn(`Archiver warning: ${warn.message}`);
      });

      archive.on("error", (err) => {
        imgBackupLogger.error(`Archiver error: ${err.message}`);
        reject(err);
      });

      archive.pipe(output);
      archive.directory(UPLOAD_DIR, "uploads");
      archive.finalize();
    });

    await pruneOldBackups(IMG_BACKUP_DIR, "images_backup_", MAX_IMG_BACKUPS_TO_KEEP, imgBackupLogger, IMG_PREV_DAYS_TO_KEEP);
  } catch (err) {
    imgBackupLogger.error(`Images backup failed: ${(err as Error).message}`);
    throw err;
  }
}

// ─────────────────────────────────────────────
//  Images backup – missed-run guard
//  Called on startup: runs the backup only if no backup file exists
//  for today (local date), so we never produce two backups in one day.
// ─────────────────────────────────────────────
async function runImagesBackupIfMissedToday() {
  try {
    const files = await fs.promises.readdir(IMG_BACKUP_DIR);

    const todayStr = (() => {
      const now = new Date();
      const y = now.getFullYear();
      const mo = pad(now.getMonth() + 1);
      const d = pad(now.getDate());
      return `${y}-${mo}-${d}`;
    })();

    const alreadyDoneToday = files.some(
      (f) => f.startsWith("images_backup_") && f.includes(todayStr)
    );

    if (alreadyDoneToday) {
      imgBackupLogger.info(`Images backup already exists for today (${todayStr}), skipping backup.`);
      return;
    }

    imgBackupLogger.info(`No images backup found for today (${todayStr}), running missed backup now.`);
    await runImagesBackup();
  } catch (err) {
    imgBackupLogger.error(`Startup images backup check failed: ${(err as Error).message}`);
  }
}

// ─────────────────────────────────────────────
//  Cron schedules
//  DB:     every 30 minutes  →  "*/30 * * * *"
//  Images: every day at 02:00 → "0 2 * * *"
// ─────────────────────────────────────────────
cron.schedule("*/30 * * * *", () => {
  runDbBackup().catch((err) => {
    dbBackupLogger.error(`Scheduled DB backup job failed: ${err.message}`);
  });
});

cron.schedule("0 2 * * *", () => {
  runImagesBackupIfMissedToday().catch((err) => {
    imgBackupLogger.error(`Scheduled images backup job failed: ${err.message}`);
  });
});

// ─────────────────────────────────────────────
//  Express app
// ─────────────────────────────────────────────
const app = express();

// Multer config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const parsedName = path.parse(file.originalname);
    if (parsedName.name === "logo") {
      cb(null, file.originalname);
    } else {
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (goes to server.log)
app.use((req, _res, next) => {
  serverLogger.info(`${req.method} ${req.url}`);
  next();
});

// Static uploads with cache headers
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=86400");
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    },
  })
);

// ── Routes ──────────────────────────────────
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    serverLogger.warn("Upload attempt with no file");
    return res.status(400).json({ error: "No file uploaded" });
  }
  serverLogger.info(`File uploaded: ${req.file.filename}`);
  res.json({ url: req.file.filename });
});

app.delete("/delete/:filename", (req, res) => {
  const { filename } = req.params;

  if (!filename || filename.includes("..")) {
    serverLogger.warn(`Rejected delete – invalid filename: ${filename}`);
    return res.status(400).json({ error: "Invalid filename" });
  }

  if (filename === "logo" || filename.startsWith("logo.")) {
    serverLogger.warn(`Attempted to delete protected file: ${filename}`);
    return res.status(403).json({ error: "Cannot delete protected file." });
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        serverLogger.warn(`Delete – file not found: ${filename}`);
        return res.status(404).json({ error: "File not found" });
      }
      serverLogger.error(`Error deleting file ${filename}: ${err.message}`);
      return res.status(500).json({ error: "Error deleting file" });
    }
    serverLogger.info(`File deleted: ${filename}`);
    res.json({ status: "OK", message: "File deleted successfully" });
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err instanceof multer.MulterError) {
    serverLogger.warn(`Multer error: ${err.message}`);
    return res.status(400).json({ error: err.message });
  }
  serverLogger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: err.message });
});

// ── Start ────────────────────────────────────
app.listen(PORT, () => {
  const localIp = getLocalNetworkIp();
  serverLogger.info(`CDN Server running on http://${localIp}:${PORT}`);
  serverLogger.info(`Uploads dir : ${UPLOAD_DIR}`);
  serverLogger.info(`DB backups  : ${DB_BACKUP_DIR}  (every 30 min)`);
  serverLogger.info(`Img backups : ${IMG_BACKUP_DIR}  (daily at 02:00, or on startup if missed)`);
  serverLogger.info(`Logs dir    : ${LOG_DIR}`);

  // Run images backup immediately if today's hasn't happened yet
  runImagesBackupIfMissedToday();
});
