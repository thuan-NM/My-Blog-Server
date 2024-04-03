const express = require("express")

const educationController = require("../controllers/educationController");
const verifyAuth = require("../middlewares/verifyAuth")

const educationsRoute = express.Router();

educationsRoute.get("/:id",educationController.getEdus);
educationsRoute.post("/",verifyAuth,educationController.createEduByUserId);
educationsRoute.delete("/:id",educationController.deleteEdu);
educationsRoute.put("/:id",verifyAuth,educationController.updateEdu);

module.exports = educationsRoute;