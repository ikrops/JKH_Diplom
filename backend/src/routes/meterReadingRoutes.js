const express = require("express");
const router = express.Router();
const meterReadingController = require("../controllers/meterReadingController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, allowRoles("admin", "employee"), meterReadingController.createMeterReading);
router.get("/", authMiddleware, allowRoles("admin", "employee", "accountant"), meterReadingController.getMeterReadings);
router.get("/latest/previous", authMiddleware, allowRoles("admin", "employee", "accountant"), meterReadingController.getLatestMeterReading);
router.get("/:id", authMiddleware, allowRoles("admin", "employee", "accountant"), meterReadingController.getMeterReadingById);
router.put("/:id", authMiddleware, allowRoles("admin", "employee"), meterReadingController.updateMeterReading);
router.delete("/:id", authMiddleware, allowRoles("admin"), meterReadingController.deleteMeterReading);

module.exports = router;
