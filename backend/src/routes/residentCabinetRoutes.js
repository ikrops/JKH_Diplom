const express = require("express");
const router = express.Router();
const residentCabinetController = require("../controllers/residentCabinetController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/me", authMiddleware, residentCabinetController.getMyCabinet);
router.put("/me", authMiddleware, residentCabinetController.updateMyProfile);
router.post("/meter-readings", authMiddleware, residentCabinetController.createMyMeterReading);

module.exports = router;
