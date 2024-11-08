const mongoose = require('mongoose');
const JobStatus = require('../models/JobStatus'); // Your Mongoose model for JobStatus
const cloudinary = require('cloudinary').v2;
const Post = require('../models/Post'); // Your Mongoose model for Post
const User = require('../models/User'); // Your Mongoose model for User
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const getJobStatus = async(req, res) => {
    try {
        const { postid, userid } = req.body;
        if (!mongoose.Types.ObjectId.isValid(postid) || !mongoose.Types.ObjectId.isValid(userid)) {
            return res.status(400).json({
                message: 'Invalid post ID or user ID format',
                data: null,
                isSuccess: false,
            });
        }
        const jobStatus = await JobStatus.find({ postid, userid });
        if (!jobStatus) {
            return res.status(404).json({
                message: 'Job status not found',
                data: null,
                isSuccess: false,
            });
        }
        return res.status(200).json({
            message: 'Get job status successful',
            data: jobStatus,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error fetching job status:', error);
        res.status(500).json({
            message: 'Failed to fetch job status',
            data: null,
            isSuccess: false,
        });
    }
};

const updateJobStatus = async(req, res) => {
    const { status, candidateInfo } = req.body;
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid job status ID format',
                data: null,
                isSuccess: false,
            });
        }
        const updatedJobStatus = await JobStatus.findByIdAndUpdate(
            id, { $set: { status, candidateInfo } }, { new: true } // Return the updated document
        );
        if (!updatedJobStatus) {
            return res.status(404).json({
                message: 'Job status not found',
                data: null,
                isSuccess: false,
            });
        }
        res.status(200).json({
            message: "Update job status by ID successful",
            data: updatedJobStatus,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error updating job status by ID:', error);
        res.status(500).json({
            message: 'Failed to update job status by ID',
            data: null,
            isSuccess: false,
        });
    }
};

const createJobStatus = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload your CV' });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'job-applications',
            public_id: `${req.body.userid}_${Date.now()}`,
            resource_type: 'auto', // Đảm bảo tệp được nhận diện đúng
            access_mode: 'public',
        });

        const cvUrl = result.secure_url;

        // Lưu thông tin job application vào CSDL
        const newJobStatus = new JobStatus({
            postid: req.body.postid,
            userid: req.body.userid,
            status: req.body.status,
            coverLetter: req.body.coverLetter,
            cvUrl, // Lưu URL của file CV
        });

        await newJobStatus.save();

        res.json({ isSuccess: true, message: 'Job application submitted', cvUrl });
    } catch (error) {
        console.error('Error uploading file or saving job status:', error);
        res.status(500).json({ isSuccess: false, message: 'Internal server error' });
    }
};

const getJobStatusByAuthor = async(req, res) => {
    try {
        const authorid = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(authorid)) {
            return res.status(400).json({
                message: 'Invalid user ID format',
                data: null,
                isSuccess: false,
            });
        }

        // Find posts by the author
        const posts = await Post.find({ "author.id": authorid });

        // Use Promise.all to optimize the query process for each post
        const updatedPosts = await Promise.all(posts.map(async(post) => {
            const jobStatusCount = await JobStatus.countDocuments({
                postid: post._id,
                status: "Applied",
            });

            // Return modified post object
            return {
                ...post.toObject(), // Convert post to plain JS object
                jobStatusCount,
            };
        }));

        return res.status(200).json({
            message: 'Get job status by author successful',
            data: updatedPosts,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error fetching job status by author:', error);
        res.status(500).json({
            message: 'Failed to fetch job status by author',
            data: null,
            isSuccess: false,
        });
    }
};

const hireCandidate = async(req, res) => {
    console.log(req)
    const { postid } = req.body;
    const userid = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userid) || !mongoose.Types.ObjectId.isValid(postid)) {
        return res.status(400).json({
            message: 'Invalid user ID or post ID format',
            data: null,
            isSuccess: false,
        });
    }
    try {
        const result = await JobStatus.updateOne({ userid, postid }, { $set: { status: 'Hired' } });
        if (result.nModified === 0) {
            return res.status(404).json({
                message: 'Job status not found',
                data: null,
                isSuccess: false,
            });
        }
        return res.status(200).json({
            message: 'Candidate hired successfully',
            data: null,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error hiring candidate:', error);
        res.status(500).json({
            message: 'Failed to hire candidate',
            data: null,
            isSuccess: false,
        });
    }
};

const denyCandidate = async(req, res) => {
    const { postid } = req.body;
    const userid = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userid) || !mongoose.Types.ObjectId.isValid(postid)) {
        return res.status(400).json({
            message: 'Invalid user ID or post ID format',
            data: null,
            isSuccess: false,
        });
    }
    try {
        const result = await JobStatus.updateOne({ userid, postid }, { $set: { status: 'Denied' } });
        if (result.nModified === 0) {
            return res.status(404).json({
                message: 'Job status not found',
                data: null,
                isSuccess: false,
            });
        }
        return res.status(200).json({
            message: 'Candidate denied successfully',
            data: null,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error denying candidate:', error);
        res.status(500).json({
            message: 'Failed to deny candidate',
            data: null,
            isSuccess: false,
        });
    }
};

const getJobWithStartus = async(req, res) => {
    try {
        const { userId, statusdata } = req.query;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Invalid user ID format',
                data: null,
                isSuccess: false,
            });
        }
        const jobStatuses = await JobStatus.find({
            userid: userId,
            status: statusdata
        });
        const posts = [];
        for (let jobStatus of jobStatuses) {
            const post = await Post.findById(jobStatus.postid);
            if (post) {
                posts.push(post);
                post.status = jobStatus;
            }
        }
        return res.status(200).json({
            message: 'Get user applied posts successful',
            data: posts,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error fetching user applied posts:', error);
        res.status(500).json({
            message: 'Failed to fetch user applied posts',
            data: null,
            isSuccess: false,
        });
    }
};

const getCandidateOfJob = async(req, res) => {
    try {
        const postId = req.params.id
        const jobStatusItems = await JobStatus.find({
            postid: postId,
            status: "Applied",
        });

        // Prepare array to store job applications details
        const userapply = await Promise.all(jobStatusItems.map(async(job) => {
            const user = await User.findById(job.userid);
            return {
                user,
                cv: job.cvUrl,
                coverLetter: job.coverLetter,
                status: job.status,
            };
        }));
        return res.status(200).json({
            message: 'Get job status by author successful',
            data: userapply,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error fetching job status by author:', error);
        res.status(500).json({
            message: 'Failed to fetch job status by author',
            data: null,
            isSuccess: false,
        });
    }
}

const deleteJobStatus = async(req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: 'Invalid job status ID format',
            data: null,
            isSuccess: false,
        });
    }
    try {
        const result = await JobStatus.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({
                message: 'Job status not found',
                data: null,
                isSuccess: false,
            });
        }
        return res.status(200).json({
            message: 'Delete job status successful',
            data: null,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error deleting job status:', error);
        res.status(500).json({
            message: 'Failed to delete job status',
            data: null,
            isSuccess: false,
        });
    }
};

const checkUserApplied = async(req, res) => {
    const { postid, userid } = req.query;
    if (!mongoose.Types.ObjectId.isValid(postid) || !mongoose.Types.ObjectId.isValid(userid)) {
        return res.status(400).json({
            message: 'Invalid post ID or user ID format',
            data: null,
            isSuccess: false,
        });
    }
    try {
        const jobStatus = await JobStatus.findOne({
            postid,
            userid,
        });
        return res.status(200).json({
            message: 'User application status fetched',
            data: jobStatus || null,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error checking user application status:', error);
        res.status(500).json({
            message: 'Failed to check user application status',
            data: null,
            isSuccess: false,
        });
    }
};

const scheduleInterview = async(req, res) => {
    const { postId, candidateId, interviewDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(candidateId)) {
        return res.status(400).json({
            message: 'Invalid post ID or candidate ID format',
            data: null,
            isSuccess: false,
        });
    }

    try {
        // Generate a unique token for the confirmation link
        const confirmationToken = crypto.randomBytes(32).toString('hex');

        // Set initial status to "Pending Interview"
        const updatedJobStatus = await JobStatus.updateOne({ userid: candidateId, postid: postId }, { $set: { status: 'Pending Interview', interviewDate, confirmationToken } });

        if (updatedJobStatus.nModified === 0) {
            return res.status(404).json({
                message: 'Job status not found',
                data: null,
                isSuccess: false,
            });
        }

        // Fetch the candidate and post details
        const candidate = await User.findById(candidateId);
        const job = await Post.findById(postId);

        // Create the confirmation link
        const confirmationUrl = `${process.env.FRONTEND_URL}/interview/confirm/${confirmationToken}`;

        // Send the interview email with the confirmation button
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your email
                pass: process.env.EMAIL_PASS, // Your password
            },
        });

        const mailOptions = {
            from: `${job.author.userdata.companyname} <${process.env.EMAIL_USER}>`,
            to: candidate.email,
            subject: 'Interview Schedule Confirmation',
            html: `
            <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
                <table align="center" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: white; padding: 20px; border-radius: 10px;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 20px;">
                            <img src="${job.author.userdata.profilePictureUrl}" alt="Company Logo" style="width: 150px;">
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 24px; font-weight: bold; text-align: center; color: #333;">Interview Confirmation</td>
                    </tr>
                    <tr>
                        <td style="padding: 20px; font-size: 16px; line-height: 1.6; color: #555;">
                            <p>Dear ${candidate.firstName},</p>
                            <p>We are excited to inform you that you have been scheduled for an interview with <strong>${job.author.userdata.companyname}</strong> for the position you've applied for.</p>
                            <p><strong>Interview Details:</strong></p>
                            <ul style="list-style-type: none; padding-left: 0;">
                                <li><strong>Date:</strong> ${new Date(interviewDate).toLocaleString()}</li>
                                <li><strong>Company:</strong> ${job.author.userdata.companyname}</li>
                                <li><strong>Location:${job.author.userdata.location.address[0]}</li>
                            </ul>
                            <p>Please confirm your availability by clicking the button below:</p>
                            <p style="text-align: center;">
                                <a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">Confirm Interview</a>
                            </p>
                            <p>If you are unable to confirm by the scheduled date, your application will be automatically declined.</p>
                            <p>We look forward to meeting you!</p>
                            <p>Best regards,</p>
                            <p><strong>${job.author.userdata.companyname} Hiring Team</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; font-size: 12px; color: #999; padding-top: 20px; border-top: 1px solid #ddd;">
                            <p>© ${new Date().getFullYear()} ${job.author.userdata.companyname}. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </div>`,
        };

        await transporter.sendMail(mailOptions);

        // Auto-deny if time exceeds
        setTimeout(async() => {
            const status = await JobStatus.findOne({ userid: candidateId, postid: postId });
            if (status && status.status === 'Pending Interview') {
                await JobStatus.updateOne({ userid: candidateId, postid: postId }, { $set: { status: 'Denied' } });
            }
        }, new Date(interviewDate).getTime() - Date.now());

        res.status(200).json({
            message: 'Interview scheduled, email sent, and awaiting confirmation.',
            isSuccess: true,
        });

    } catch (error) {
        console.error('Error scheduling interview:', error);
        res.status(500).json({
            message: 'Failed to schedule interview',
            isSuccess: false,
        });
    }
};

// Endpoint to handle interview confirmation
const confirmInterview = async(req, res) => {
    const { token } = req.params;
    try {
        const jobStatus = await JobStatus.findOne({ confirmationToken: token });
        console.log(jobStatus)
        if (!jobStatus) {
            return res.status(400).json({
                message: 'Invalid or expired token',
                isSuccess: false,
            });
        }

        // Update status to "Interview"
        jobStatus.status = 'Interview';
        await jobStatus.save();

        res.status(200).json({
            message: 'Interview confirmed successfully.',
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error confirming interview:', error);
        res.status(500).json({
            message: 'Failed to confirm interview',
            isSuccess: false,
        });
    }
};

module.exports = {
    getJobStatus,
    updateJobStatus,
    createJobStatus,
    getJobStatusByAuthor,
    hireCandidate,
    denyCandidate,
    getJobWithStartus,
    deleteJobStatus,
    checkUserApplied,
    getCandidateOfJob,
    scheduleInterview,
    confirmInterview,
};