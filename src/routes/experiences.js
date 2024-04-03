const express = require("express")

const experienceController = require("../controllers/experienceController");
const verifyAuth = require("../middlewares/verifyAuth")

const experiencesRoute = express.Router();

experiencesRoute.get("/:id",experienceController.getExps);
experiencesRoute.post("/",verifyAuth,experienceController.createExpByUserId);
experiencesRoute.delete("/:id",experienceController.deleteExp);
experiencesRoute.put("/:id",verifyAuth,experienceController.updateExp);

module.exports = experiencesRoute;