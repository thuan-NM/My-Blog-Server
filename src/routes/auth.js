const express = require("express");

const authController = require("../controllers/authController");
const validateRegisterInput = require("../middlewares/validRegister");
const verifyAuth = require("../middlewares/verifyAuth");

const authRouter = express.Router();

authRouter.post("/login", authController.login);

authRouter.post("/register", validateRegisterInput ,authController.register);

authRouter.put("/changepassword/:id",verifyAuth ,authController.changePassword);

module.exports = authRouter;