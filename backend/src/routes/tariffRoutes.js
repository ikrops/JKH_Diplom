const express = require("express");
const router = express.Router();
const tariffController = require("../controllers/tariffController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, allowRoles("admin"), tariffController.createTariff);
router.get("/", authMiddleware, allowRoles("admin", "employee", "accountant"), tariffController.getTariffs);
router.get("/:id", authMiddleware, allowRoles("admin", "employee", "accountant"), tariffController.getTariffById);
router.put("/:id", authMiddleware, allowRoles("admin"), tariffController.updateTariff);
router.delete("/:id", authMiddleware, allowRoles("admin"), tariffController.deleteTariff);

module.exports = router;
