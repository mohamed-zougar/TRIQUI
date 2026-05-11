const crypto = require("crypto");
const path = require("path");
const supabase = require("../config/supabase");
const env = require("../config/env");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function uploadFile(req, res, next) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return res.status(400).json({ message: "Unsupported image format." });
    }

    const safeExtension = (path.extname(file.originalname) || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
    const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExtension || ""}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(env.storageBucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ message: "Failed to upload file." });
    }

    const { data } = supabase.storage.from(env.storageBucket).getPublicUrl(filePath);

    return res.status(200).json({ url: data.publicUrl });
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadFile };
