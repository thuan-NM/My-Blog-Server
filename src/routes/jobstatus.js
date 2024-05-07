const express = require("express")

const jobstatusController = require("../controllers/jobstatusController");
const verifyAuth = require("../middlewares/verifyAuth")

const jobstatusRoute = express.Router();

jobstatusRoute.get("/", jobstatusController.getJobStatus);
jobstatusRoute.get("/:id", jobstatusController.getJobStatusByAuthor);
jobstatusRoute.post("/", verifyAuth, jobstatusController.createJobStatus);
jobstatusRoute.put("/:id", verifyAuth, jobstatusController.updateJobStatus);

// Thêm các route mới
jobstatusRoute.put("/hire/:id", verifyAuth, jobstatusController.hireCandidate);
jobstatusRoute.put("/deny/:id", verifyAuth, jobstatusController.denyCandidate);

module.exports = jobstatusRoute;
