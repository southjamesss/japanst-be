const express = require("express");
const {
  listFileAttachments,
  getFileAttachment,
  createFileAttachment,
  updateFileAttachment,
  deleteFileAttachment,
} = require("../controllers/fileAttachmentsController");

const router = express.Router();

router.route("/").get(listFileAttachments).post(createFileAttachment);
router
  .route("/:id")
  .get(getFileAttachment)
  .put(updateFileAttachment)
  .patch(updateFileAttachment)
  .delete(deleteFileAttachment);

module.exports = router;
