const express = require("express");
const commentsRoute = express.Router();
const commentsController = require("../controllers/commentsController");
const verifyAuth = require("../middlewares/verifyAuth")
//get all
commentsRoute.get("/", commentsController.getComment);
//get by id
commentsRoute.get("/:id", commentsController.getCommentByPostId);
//create
commentsRoute.post("/", commentsController.createComment);
//edit
commentsRoute.put("/:id", commentsController.editComment);
//delete
commentsRoute.delete("/:id", commentsController.deleteComment);

module.exports = commentsRoute;