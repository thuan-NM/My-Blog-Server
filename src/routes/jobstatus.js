const express = require("express");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const jobstatusController = require("../controllers/jobstatusController");
const verifyAuth = require("../middlewares/verifyAuth");

const jobstatusRoute = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: 'uploads/' }); // Lưu file tạm thời vào thư mục 'uploads'

// Existing routes
jobstatusRoute.get("/", jobstatusController.getJobStatus);
jobstatusRoute.get("/applied", jobstatusController.getJobWithStartus);
jobstatusRoute.get("/checkUserApplied", jobstatusController.checkUserApplied);
jobstatusRoute.get("/candidate/:id", jobstatusController.getCandidateOfJob);
jobstatusRoute.get("/:id", jobstatusController.getJobStatusByAuthor);
jobstatusRoute.post("/", verifyAuth, upload.single('cv'), jobstatusController.createJobStatus);
jobstatusRoute.put("/:id", verifyAuth, jobstatusController.updateJobStatus);
jobstatusRoute.delete("/:id", verifyAuth, jobstatusController.deleteJobStatus);
jobstatusRoute.put("/hire/:id", verifyAuth, jobstatusController.hireCandidate);
jobstatusRoute.put("/deny/:id", verifyAuth, jobstatusController.denyCandidate);

// New routes for interview scheduling and confirmation
jobstatusRoute.post("/scheduleInterview", verifyAuth, jobstatusController.scheduleInterview); // For scheduling interviews
jobstatusRoute.get("/confirmInterview/:token", jobstatusController.confirmInterview); // For confirming interviews via token

module.exports = jobstatusRoute;