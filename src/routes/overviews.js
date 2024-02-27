const express = require("express")

const overviewController = require("../controllers/overviewController");
const verifyAuth = require("../middlewares/verifyAuth")

const overviewsRoute = express.Router();

overviewsRoute.get("/:id",overviewController.getOverviews);
overviewsRoute.post("/",verifyAuth,overviewController.createOverviewByUserId)

module.exports = overviewsRoute;