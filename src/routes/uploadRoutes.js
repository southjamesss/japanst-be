const express = require("express");

const { uploadFiles } = require("../controllers/uploadController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", upload.any(), uploadFiles);

module.exports = router;
