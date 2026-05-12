const express = require("express");
const router = express.Router();
const residentController = require("../controllers/residentController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, allowRoles("admin", "employee"), residentController.createResident);
router.get("/", authMiddleware, allowRoles("admin", "employee", "accountant"), residentController.getResidents);
router.get("/:id", authMiddleware, allowRoles("admin", "employee", "accountant"), residentController.getResidentById);
router.put("/:id", authMiddleware, allowRoles("admin", "employee"), residentController.updateResident);
router.delete("/:id", authMiddleware, allowRoles("admin"), residentController.deleteResident);

module.exports = router;
