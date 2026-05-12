const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, allowRoles("admin"), serviceController.createService);
router.get("/", authMiddleware, allowRoles("admin", "employee", "accountant", "resident"), serviceController.getServices);
router.get("/:id", authMiddleware, allowRoles("admin", "employee", "accountant"), serviceController.getServiceById);
router.put("/:id", authMiddleware, allowRoles("admin"), serviceController.updateService);
router.delete("/:id", authMiddleware, allowRoles("admin"), serviceController.deleteService);

module.exports = router;
