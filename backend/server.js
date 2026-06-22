const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:3001" }));
app.use(express.json());

// ─── Storage ───────────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads");
const META_FILE = path.join(__dirname, "metadata.json");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, JSON.stringify({}));

const readMeta = () => JSON.parse(fs.readFileSync(META_FILE, "utf-8"));
const writeMeta = (data) =>
  fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2));

// ─── Multer Config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// ─── Cleanup Expired Files ─────────────────────────────────────────────────────
const cleanupExpired = () => {
  const meta = readMeta();
  const now = Date.now();
  let changed = false;

  for (const [shareId, info] of Object.entries(meta)) {
    if (info.expiresAt && now > info.expiresAt) {
      const filePath = path.join(UPLOADS_DIR, info.storedName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      delete meta[shareId];
      changed = true;
      console.log(`[Cleanup] Expired file deleted: ${info.originalName}`);
    }
  }

  if (changed) writeMeta(meta);
};

// Run cleanup every 60 seconds
setInterval(cleanupExpired, 60 * 1000);

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /upload — Upload a file with optional expiry
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const shareId = uuidv4();
    const expiryMinutes = parseInt(req.body.expiryMinutes) || 60; // default 1 hour
    const expiresAt = Date.now() + expiryMinutes * 60 * 1000;

    const meta = readMeta();
    meta[shareId] = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: Date.now(),
      expiresAt,
      expiryMinutes,
      downloads: 0,
    };
    writeMeta(meta);

    res.json({
      shareId,
      shareUrl: `http://localhost:3001/share/${shareId}`,
      fileName: req.file.originalname,
      size: req.file.size,
      expiresAt,
      expiryMinutes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed." });
  }
});

// GET /file/:shareId — Get file metadata
app.get("/file/:shareId", (req, res) => {
  cleanupExpired();
  const meta = readMeta();
  const info = meta[req.params.shareId];

  if (!info) return res.status(404).json({ error: "File not found or expired." });

  res.json({
    fileName: info.originalName,
    size: info.size,
    mimeType: info.mimeType,
    uploadedAt: info.uploadedAt,
    expiresAt: info.expiresAt,
    expiryMinutes: info.expiryMinutes,
    downloads: info.downloads,
  });
});

// GET /download/:shareId — Download the file
app.get("/download/:shareId", (req, res) => {
  cleanupExpired();
  const meta = readMeta();
  const info = meta[req.params.shareId];

  if (!info) return res.status(404).json({ error: "File not found or expired." });

  const filePath = path.join(UPLOADS_DIR, info.storedName);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "File missing from storage." });

  // Increment download count
  info.downloads += 1;
  writeMeta(meta);

  res.download(filePath, info.originalName);
});

// GET /files — List all active (non-expired) files
app.get("/files", (req, res) => {
  cleanupExpired();
  const meta = readMeta();
  const now = Date.now();

  const files = Object.entries(meta)
    .filter(([, info]) => info.expiresAt > now)
    .map(([shareId, info]) => ({
      shareId,
      fileName: info.originalName,
      size: info.size,
      uploadedAt: info.uploadedAt,
      expiresAt: info.expiresAt,
      downloads: info.downloads,
    }))
    .sort((a, b) => b.uploadedAt - a.uploadedAt);

  res.json(files);
});

// DELETE /file/:shareId — Delete a file manually
app.delete("/file/:shareId", (req, res) => {
  const meta = readMeta();
  const info = meta[req.params.shareId];
  if (!info) return res.status(404).json({ error: "File not found." });

  const filePath = path.join(UPLOADS_DIR, info.storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  delete meta[req.params.shareId];
  writeMeta(meta);

  res.json({ message: "File deleted successfully." });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FileshareApp Backend running on http://localhost:${PORT}`);
  console.log(`   Uploads stored in: ${UPLOADS_DIR}`);
  console.log(`   Cleanup interval: every 60s\n`);
});