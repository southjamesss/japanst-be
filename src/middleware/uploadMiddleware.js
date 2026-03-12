const crypto = require("crypto");
const path = require("path");

const multer = require("multer");

const { maxFileSizeBytes, uploadDirectory } = require("../config/upload");
const { normalizeUploadedFileName } = require("../utils/uploadedFileName");

function sanitizeBaseName(originalName) {
  const normalizedOriginalName = normalizeUploadedFileName(originalName);
  const extension = path.extname(normalizedOriginalName || "");
  const baseName = path
    .basename(normalizedOriginalName || "file", extension)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return {
    extension: extension.toLowerCase(),
    baseName: baseName || "file",
  };
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    file.normalizedOriginalName = normalizeUploadedFileName(file.originalname);

    const { extension, baseName } = sanitizeBaseName(
      file.normalizedOriginalName
    );

    callback(
      null,
      `${Date.now()}-${crypto.randomUUID()}-${baseName}${extension}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
  },
});

module.exports = upload;
