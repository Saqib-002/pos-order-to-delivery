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
dotenv.config();

const app = express();
const PORT = 3001;
const UPLOAD_DIR = path.join(__dirname, "../uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer config: Disk storage for performance (avoids loading full file into memory), limits to 2MB, only images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const parsedName = path.parse(file.originalname);
    if (parsedName.name === "logo") {
      cb(null, file.originalname);
    } else {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Middleware for performance and security
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

// Serve static files from /uploads with cache headers (1 day for images)
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res, path) => {
      res.set("Cache-Control", "public, max-age=86400"); // 1 day cache
      res.set("Access-Control-Allow-Origin", "*");
      res.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );
    },
  })
);

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ url: req.file.filename });
});
app.delete("/delete/:filename", (req, res) => {
  const { filename } = req.params;

  // Basic security check: prevent directory traversal
  if (!filename || filename.includes("..")) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  // Prevent deletion of special files, e.g., the logo
  if (filename === "logo" || filename.startsWith("logo.")) {
    console.warn(`Attempted to delete protected file: ${filename}`);
    return res.status(403).json({ error: "Cannot delete protected file." });
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        // File not found. Treat as "success" since the file is gone.
        console.warn(`File not found, could not delete: ${filename}`);
        return res.status(404).json({ error: "File not found" });
      }
      // Other errors (e.g., permissions)
      console.error(`Error deleting file ${filename}:`, err);
      return res.status(500).json({ error: "Error deleting file" });
    }

    res.json({ status: "OK", message: "File deleted successfully" });
  });
});
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message });
});
function getLocalNetworkIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost"; // Fallback
}
const DB_USER = process.env.DB_USER || "your_postgres_user";
const DB_PASSWORD = process.env.DB_PASSWORD || "your_postgres_password";
const DB_NAME = process.env.DB_NAME || "your_database_name";
const DB_HOST = process.env.DB_HOST || "localhost";
const BACKUP_DIR = "C:\\backups"; // Target directory on C drive
const TEMP_DIR = path.join(__dirname, "../temp_backups"); // Temporary storage
const MAX_BACKUPS_TO_KEEP = 1;
// Ensure temp and backup directories exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}
async function cleanupOldBackups() {
  try {
    const files = await fs.promises.readdir(BACKUP_DIR);

    const backupFiles = files
      .filter(file => file.startsWith("backup_") && file.endsWith(".zip"))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
      }));

    // Get file stats to sort by creation time
    const fileStats = await Promise.all(
      backupFiles.map(async (file) => {
        const stat = await fs.promises.stat(file.path);
        return { ...file, mtime: stat.mtime };
      })
    );

    // Sort by modification time, newest first
    fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Find files to delete
    const filesToDelete = fileStats.slice(MAX_BACKUPS_TO_KEEP);

    if (filesToDelete.length > 0) {
      console.log(`Found ${filesToDelete.length} old backups to delete.`);
      for (const file of filesToDelete) {
        await fs.promises.unlink(file.path);
      }
    } else {
      console.log("No old backups to delete.");
    }
  } catch (err) {
    console.error("Error cleaning up old backups:", err);
  }
}
async function createBackup() {

  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const dbDumpFileName = `db_snapshot_${timestamp}.sql`;
  const dbDumpFilePath = path.join(TEMP_DIR, dbDumpFileName);
  const zipFileName = `backup_${timestamp}.zip`;
  const zipFilePath = path.join(BACKUP_DIR, zipFileName);

  // 1. Create PostgreSQL Snapshot (pg_dump)
  const dumpCommand = `pg_dump -U ${DB_USER} -h ${DB_HOST} -d ${DB_NAME} -F c -b -v -f ${dbDumpFilePath}`;

  await new Promise<void>((resolve, reject) => {
    // Set password via environment variable for security
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

    exec(dumpCommand, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`pg_dump error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.log(`pg_dump stderr: ${stderr}`);
      }
      console.log(`Database snapshot created: ${dbDumpFileName}`);
      resolve();
    });
  });

  // 2. Create Zip of uploads folder and DB snapshot
  await new Promise<void>(async (resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Set compression level
    });

    output.on("close", async () => {
      console.log(`Archive created: ${zipFileName} (${archive.pointer()} total bytes)`);
      await cleanupOldBackups();
      resolve();
    });

    archive.on("error", (err) => {
      console.error("Archiving error:", err);
      reject(err);
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Add the 'uploads' directory to the zip
    // UPLOAD_DIR is from your existing code
    archive.directory(UPLOAD_DIR, "uploads");

    // Add the database dump file to the zip
    archive.file(dbDumpFilePath, { name: dbDumpFileName });

    // Finalize the archive
    archive.finalize();
  });

  // 3. Cleanup temporary DB dump file
  fs.unlink(dbDumpFilePath, (err) => {
    if (err) {
      console.error(`Failed to delete temp file ${dbDumpFilePath}:`, err);
    } else {
      console.log(`Temporary file deleted: ${dbDumpFileName}`);
    }
  });
}

// Schedule the backup to run every 10 minutes
cron.schedule("*/15 * * * *", () => {
  createBackup().catch((err) => {
    console.error("Backup job failed:", err);
  });
});
app.listen(PORT, () => {
  const localIp = getLocalNetworkIp();
  console.log(`Local CDN Server running on http://${localIp}:${PORT}`);
});