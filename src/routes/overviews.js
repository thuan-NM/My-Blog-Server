const express = require("express");

const overviewController = require("../controllers/overviewController");
const verifyAuth = require("../middlewares/verifyAuth");

const overviewsRoute = express.Router();

// Routes for User Overview
overviewsRoute.get("/user/:id", overviewController.getOverviews); // Get overview by User ID
overviewsRoute.post("/user", verifyAuth, overviewController.createOverviewByUserId); // Create or update overview by User ID

// Routes for Company Overview
overviewsRoute.get("/company/:id", overviewController.getCompanyOverviews); // Get overview by Company ID
overviewsRoute.post("/company", verifyAuth, overviewController.createOverviewByCompanyId); // Create or update overview by Company ID

module.exports = overviewsRoute;