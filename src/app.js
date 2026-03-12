const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { publicUploadBasePath, uploadDirectory } = require("./config/upload");
const fileAttachmentRoutes = require("./routes/fileAttachmentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin:
      corsOrigin === "*"
        ? true
        : corsOrigin.split(",").map((origin) => origin.trim()),
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(publicUploadBasePath, express.static(uploadDirectory));

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Japanst backend is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.use("/upload", uploadRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/file-attachments", fileAttachmentRoutes);
app.use("/api/file-attachments", fileAttachmentRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);

  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file exceeds the allowed size limit"
        : err.message;

    return res.status(400).json({
      message,
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;
