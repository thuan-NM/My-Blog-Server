const express = require("express");

const reactionsController = require("../controllers/reactionsController");
const verifyAuth = require("../middlewares/verifyAuth")

const reactsRouter = express.Router();

reactsRouter.get("/:id",reactionsController.getReactionStats);

reactsRouter.post("/:id",reactionsController.handleReaction);

module.exports = reactsRouter;