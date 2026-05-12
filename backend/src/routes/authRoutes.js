const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.put("/me/password", authMiddleware, authController.changeMyPassword);
router.get("/users", authMiddleware, allowRoles("admin"), authController.getUsers);
router.put("/users/:id", authMiddleware, allowRoles("admin"), authController.updateUser);
router.delete("/users/:id", authMiddleware, allowRoles("admin"), authController.deleteUser);

module.exports = router;
