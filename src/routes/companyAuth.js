const express = require("express");

const companyAuthController = require("../controllers/companyAuthController");
const validateRegisterCompany = require("../middlewares/validRegisterForConpany");
const verifyAuth = require("../middlewares/verifyAuth");

const compannyAuthRouter = express.Router();

compannyAuthRouter.post("/login", companyAuthController.companyLogin);

compannyAuthRouter.post("/register",validateRegisterCompany, companyAuthController.companyRegister);

compannyAuthRouter.put("/changepassword/:id",verifyAuth ,companyAuthController.companyChangePassword);

compannyAuthRouter.get('/verify-email', companyAuthController.verifyEmail);


module.exports = compannyAuthRouter;