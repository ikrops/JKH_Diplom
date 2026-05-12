const express = require("express");
const router = express.Router();
const apartmentController = require("../controllers/apartmentController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, allowRoles("admin", "employee"), apartmentController.createApartment);
router.get("/", authMiddleware, allowRoles("admin", "employee", "accountant"), apartmentController.getApartments);
router.get("/:id", authMiddleware, allowRoles("admin", "employee", "accountant"), apartmentController.getApartmentById);
router.put("/:id", authMiddleware, allowRoles("admin", "employee"), apartmentController.updateApartment);
router.delete("/:id", authMiddleware, allowRoles("admin"), apartmentController.deleteApartment);

module.exports = router;
