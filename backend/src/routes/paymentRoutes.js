const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, allowRoles("admin", "accountant"), paymentController.createPayment);
router.get("/", authMiddleware, allowRoles("admin", "accountant"), paymentController.getPayments);
router.get("/:id", authMiddleware, allowRoles("admin", "accountant"), paymentController.getPaymentById);
router.delete("/:id", authMiddleware, allowRoles("admin"), paymentController.deletePayment);

module.exports = router;
