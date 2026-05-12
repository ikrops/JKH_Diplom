const express = require("express");
const router = express.Router();
const chargeController = require("../controllers/chargeController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, allowRoles("admin", "accountant"), chargeController.createCharge);
router.get("/", authMiddleware, allowRoles("admin", "employee", "accountant"), chargeController.getCharges);
router.get("/:id", authMiddleware, allowRoles("admin", "employee", "accountant"), chargeController.getChargeById);
router.put("/:id", authMiddleware, allowRoles("admin", "accountant"), chargeController.updateCharge);
router.delete("/:id", authMiddleware, allowRoles("admin"), chargeController.deleteCharge);

module.exports = router;
