import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { networkInterfaces } from "os";

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
app.listen(PORT, () => {
  const localIp = getLocalNetworkIp();
  console.log(`Local CDN Server running on http://${localIp}:${PORT}`);
});