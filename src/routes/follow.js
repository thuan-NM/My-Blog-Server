const express = require("express");
const followController = require("../controllers/followController");
const verifyAuth = require("../middlewares/verifyAuth");

const followRouter = express.Router();

followRouter.post("/follow", verifyAuth, followController.followUser);
followRouter.post("/unfollow", verifyAuth, followController.unfollowUser);
followRouter.get("/followers/:id", verifyAuth, followController.getFollowers);
followRouter.get("/following/:id", verifyAuth, followController.getFollowing);

module.exports = followRouter;
