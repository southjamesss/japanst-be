const fs = require("fs");
const path = require("path");

const maxFileSizeMb = Number.parseInt(process.env.MAX_FILE_SIZE_MB || "50", 10);

if (Number.isNaN(maxFileSizeMb) || maxFileSizeMb <= 0) {
  throw new Error("MAX_FILE_SIZE_MB must be a positive number");
}

const uploadDirectory = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
const publicUploadBasePath = "/uploads";

fs.mkdirSync(uploadDirectory, { recursive: true });

function getPublicUploadPath(fileName) {
  return `${publicUploadBasePath}/${fileName}`;
}

function getAbsoluteUploadPath(filePath) {
  if (typeof filePath !== "string") {
    return null;
  }

  if (!filePath.startsWith(`${publicUploadBasePath}/`)) {
    return null;
  }

  const fileName = filePath.slice(publicUploadBasePath.length + 1);

  if (!fileName) {
    return null;
  }

  return path.join(uploadDirectory, path.basename(fileName));
}

module.exports = {
  uploadDirectory,
  publicUploadBasePath,
  maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
  getPublicUploadPath,
  getAbsoluteUploadPath,
};
