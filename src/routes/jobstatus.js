const express = require("express");

const jobstatusController = require("../controllers/jobstatusController");
const verifyAuth = require("../middlewares/verifyAuth")

const jobstatusRoute = express.Router();

jobstatusRoute.get("/", jobstatusController.getJobStatus);
jobstatusRoute.get("/applied", jobstatusController.getUserAppliedPosts);
jobstatusRoute.get("/checkUserApplied", jobstatusController.checkUserApplied);
jobstatusRoute.get("/:id", jobstatusController.getJobStatusByAuthor);
jobstatusRoute.post("/", verifyAuth, jobstatusController.createJobStatus);
jobstatusRoute.put("/:id", verifyAuth, jobstatusController.updateJobStatus);
jobstatusRoute.delete("/:id", verifyAuth, jobstatusController.deleteJobStatus);
jobstatusRoute.put("/hire/:id", verifyAuth, jobstatusController.hireCandidate);
jobstatusRoute.put("/deny/:id", verifyAuth, jobstatusController.denyCandidate);

module.exports = jobstatusRoute;
