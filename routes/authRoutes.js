const express = require("express");
const router = express.Router();
const {
  login,
  register,
  googleLogin,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
module.exports = router;
