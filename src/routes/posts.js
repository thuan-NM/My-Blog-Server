const express = require("express");

const postsController = require("../controllers/postsController");
const verifyAuth = require("../middlewares/verifyAuth")

const postsRouter = express.Router();

// GET posts
postsRouter.get("/", postsController.getPosts);

postsRouter.get("/search", postsController.searchPosts);
postsRouter.get("/topjob", postsController.getTopPosts);
postsRouter.get("/mostinterest", postsController.getMostInterestPosts);
postsRouter.get("/:id", postsController.getPostById);
postsRouter.get("/related/:id", postsController.getRelatedPosts);


postsRouter.get("/user/:id", postsController.getPostByUserId);
postsRouter.get("/company/:id", postsController.getPostByCompanyId);
// CREATE new post
postsRouter.post("/", verifyAuth, postsController.createPost);

postsRouter.post("/filter", verifyAuth, postsController.getFilterPost);

// UPDATE post
postsRouter.put("/:id", postsController.updatePost);

// DELETE post
postsRouter.delete("/:id", postsController.deletePost);

module.exports = postsRouter;