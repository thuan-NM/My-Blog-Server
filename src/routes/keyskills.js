const express = require("express");

const keyskillController = require("../controllers/keyskillController");
const verifyAuth = require("../middlewares/verifyAuth");

const keyskillsRoute = express.Router();

// Routes for Company Key Skills
keyskillsRoute.get("/company/:id", keyskillController.getKeySkillsByCompanyId); // Get key skills by Company ID
keyskillsRoute.post("/company", verifyAuth, keyskillController.createKeySkillsByCompanyId); // Create or update key skills by Company ID

module.exports = keyskillsRoute;
