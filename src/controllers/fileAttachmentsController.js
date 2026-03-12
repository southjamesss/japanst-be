const fs = require("fs/promises");

const pool = require("../config/db");
const { getAbsoluteUploadPath } = require("../config/upload");

const tableName = "file_attachments";
const stringFields = ["module", "file_name", "file_path", "file_type"];
const integerFields = ["ref_id", "file_size", "uploaded_by"];
const editableFields = [...stringFields, ...integerFields];

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseId(value, fieldName = "id") {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw createHttpError(400, `${fieldName} must be a positive integer`);
  }

  return parsedValue;
}

function normalizeIntegerField(field, value) {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    throw createHttpError(400, `${field} cannot be empty`);
  }

  const parsedValue = Number(value);

  if (!Number.isSafeInteger(parsedValue)) {
    throw createHttpError(400, `${field} must be an integer or null`);
  }

  return parsedValue;
}

function normalizeStringField(field, value) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(400, `${field} must be a string or null`);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw createHttpError(400, `${field} cannot be empty`);
  }

  return trimmedValue;
}

function buildPayload(body) {
  const payload = {};

  for (const field of editableFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      continue;
    }

    if (stringFields.includes(field)) {
      payload[field] = normalizeStringField(field, body[field]);
      continue;
    }

    payload[field] = normalizeIntegerField(field, body[field]);
  }

  return payload;
}

async function getFileAttachmentById(id) {
  const [rows] = await pool.query(
    `SELECT id, module, ref_id, file_name, file_path, file_type, file_size, uploaded_by, created_at
     FROM ${tableName}
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

async function listFileAttachments(_req, res, next) {
  try {
    const conditions = [];
    const values = [];

    if (_req.query.module) {
      conditions.push("module = ?");
      values.push(_req.query.module);
    }

    if (_req.query.ref_id) {
      const refId = parseId(_req.query.ref_id, "ref_id");
      conditions.push("ref_id = ?");
      values.push(refId);
    }

    if (_req.query.uploaded_by) {
      const uploadedBy = parseId(_req.query.uploaded_by, "uploaded_by");
      conditions.push("uploaded_by = ?");
      values.push(uploadedBy);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT id, module, ref_id, file_name, file_path, file_type, file_size, uploaded_by, created_at
       FROM ${tableName}
       ${whereClause}
       ORDER BY id DESC`,
      values
    );

    res.status(200).json({
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

async function getFileAttachment(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const fileAttachment = await getFileAttachmentById(id);

    if (!fileAttachment) {
      throw createHttpError(404, "File attachment not found");
    }

    res.status(200).json({
      data: fileAttachment,
    });
  } catch (error) {
    next(error);
  }
}

async function createFileAttachment(req, res, next) {
  try {
    const payload = buildPayload(req.body);
    const columns = Object.keys(payload);

    if (columns.length === 0) {
      throw createHttpError(
        400,
        `Request body must include at least one of: ${editableFields.join(", ")}`
      );
    }

    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((column) => payload[column]);

    const [result] = await pool.query(
      `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );

    const fileAttachment = await getFileAttachmentById(result.insertId);

    res.status(201).json({
      message: "File attachment created successfully",
      data: fileAttachment,
    });
  } catch (error) {
    next(error);
  }
}

async function updateFileAttachment(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const payload = buildPayload(req.body);
    const columns = Object.keys(payload);

    if (columns.length === 0) {
      throw createHttpError(
        400,
        `Request body must include at least one of: ${editableFields.join(", ")}`
      );
    }

    const assignments = columns.map((column) => `${column} = ?`).join(", ");
    const values = columns.map((column) => payload[column]);

    const [result] = await pool.query(
      `UPDATE ${tableName}
       SET ${assignments}
       WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, "File attachment not found");
    }

    const fileAttachment = await getFileAttachmentById(id);

    res.status(200).json({
      message: "File attachment updated successfully",
      data: fileAttachment,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteFileAttachment(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const fileAttachment = await getFileAttachmentById(id);

    if (!fileAttachment) {
      throw createHttpError(404, "File attachment not found");
    }

    const [result] = await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      throw createHttpError(404, "File attachment not found");
    }

    const absoluteUploadPath = getAbsoluteUploadPath(fileAttachment.file_path);

    if (absoluteUploadPath) {
      try {
        await fs.unlink(absoluteUploadPath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error(error);
        }
      }
    }

    res.status(200).json({
      message: "File attachment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listFileAttachments,
  getFileAttachment,
  createFileAttachment,
  updateFileAttachment,
  deleteFileAttachment,
};
