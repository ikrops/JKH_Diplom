const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const auditLogController = require("../controllers/auditLogController");

router.get("/", authMiddleware, allowRoles("admin"), auditLogController.getAuditLogs);

module.exports = router;
