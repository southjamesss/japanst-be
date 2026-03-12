const fs = require("fs/promises");

const pool = require("../config/db");
const { getPublicUploadPath } = require("../config/upload");
const { normalizeUploadedFileName } = require("../utils/uploadedFileName");

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeOptionalString(field, value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(400, `${field} must be a string`);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  return trimmedValue;
}

function normalizeOptionalInteger(field, value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isSafeInteger(parsedValue)) {
    throw createHttpError(400, `${field} must be an integer`);
  }

  return parsedValue;
}

function getBodyValue(body, ...keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      return body[key];
    }
  }

  return undefined;
}

async function removeSavedFiles(files) {
  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.unlink(file.path);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error(error);
        }
      }
    })
  );
}

async function uploadFiles(req, res, next) {
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];

  if (uploadedFiles.length === 0) {
    next(createHttpError(400, "At least one file is required"));
    return;
  }

  let connection;

  try {
    const moduleValue = normalizeOptionalString(
      "module",
      getBodyValue(req.body, "module")
    );
    const refId = normalizeOptionalInteger(
      "ref_id",
      getBodyValue(req.body, "ref_id", "refId")
    );
    const uploadedBy = normalizeOptionalInteger(
      "uploaded_by",
      getBodyValue(req.body, "uploaded_by", "uploadedBy")
    );

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const attachments = [];

    for (const file of uploadedFiles) {
      const originalFileName =
        file.normalizedOriginalName ||
        normalizeUploadedFileName(file.originalname);
      const filePath = getPublicUploadPath(file.filename);
      const [result] = await connection.query(
        `INSERT INTO file_attachments (
          module,
          ref_id,
          file_name,
          file_path,
          file_type,
          file_size,
          uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          moduleValue,
          refId,
          originalFileName,
          filePath,
          file.mimetype || null,
          file.size,
          uploadedBy,
        ]
      );

      const [rows] = await connection.query(
        `SELECT id, module, ref_id, file_name, file_path, file_type, file_size, uploaded_by, created_at
         FROM file_attachments
         WHERE id = ?`,
        [result.insertId]
      );

      attachments.push(rows[0]);
    }

    await connection.commit();

    res.status(201).json({
      message:
        attachments.length === 1
          ? "File uploaded successfully"
          : "Files uploaded successfully",
      count: attachments.length,
      data: attachments.length === 1 ? attachments[0] : attachments,
      files: attachments,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    await removeSavedFiles(uploadedFiles);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  uploadFiles,
};
