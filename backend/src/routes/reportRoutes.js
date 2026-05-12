const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.get("/summary", authMiddleware, allowRoles("admin", "accountant"), reportController.getSummaryReport);
router.get("/debtors", authMiddleware, allowRoles("admin", "accountant"), reportController.getDebtorsReport);

module.exports = router;
