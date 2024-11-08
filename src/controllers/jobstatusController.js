const mongoose = require('mongoose');
const JobStatus = require('../models/JobStatus'); // Your Mongoose model for JobStatus
const cloudinary = require('cloudinary').v2;
const Post = require('../models/Post'); // Your Mongoose model for Post
const User = require('../models/User'); // Your Mongoose model for User
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Company = require('../models/Company');
const Room = require('../models/Room');

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

const getJobstatusDetails = async(req, res) => {
    try {
        const { jobStatusId } = req.params;

        // Find the job status by ID in the database
        const jobStatus = await JobStatus.findById(jobStatusId).lean();
        if (!jobStatus) {
            return res.status(404).json({ message: 'Job status not found' });
        }

        // Respond with the job status details, focusing on companyid and userid
        res.status(200).json({
            companyid: jobStatus.companyid,
            userid: jobStatus.userid,
        });
    } catch (error) {
        console.error('Error retrieving job status:', error);
        res.status(500).json({ message: 'Error retrieving job status' });
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
        console.log('Creating job status')
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
            companyid: req.body.companyid,
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

const requestConfirmation = async(req, res) => {
    const { postId, candidateId } = req.body;
    console.log(req.body)
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

        // Set initial status to "Confirmation Pending"
        const updatedJobStatus = await JobStatus.updateOne({ userid: candidateId, postid: postId }, {
            $set: {
                status: 'Confirmation Pending',
                confirmationToken,
                tokenExpiry: Date.now() + 2 * 24 * 60 * 60 * 1000 // 2 days from now
            }
        });

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
        const confirmationUrl = `${process.env.FRONTEND_URL}/sendrequest/confirm/${confirmationToken}`;

        // Send the confirmation request email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `${job.author.userdata.companyname} <${process.env.EMAIL_USER}>`,
            to: candidate.email,
            subject: 'Interview Confirmation Request',
            html: `
            <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
                <table align="center" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: white; padding: 20px; border-radius: 10px;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 20px;">
                            <img src="${encodeURI(job.author.userdata.profilePictureUrl)}" alt="Company Logo" style="width: 150px;">
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 24px; font-weight: bold; text-align: center; color: #333;">Interview Confirmation Request</td>
                    </tr>
                    <tr>
                        <td style="padding: 20px; font-size: 16px; line-height: 1.6; color: #555;">
                            <p>Dear ${candidate.firstName},</p>
                            <p>You have received a request to confirm your interest in an interview for the position at <strong>${job.author.userdata.companyname}</strong>.</p>
                            <p>Please confirm your participation by clicking the button below within 2 days:</p>
                            <p style="text-align: center;">
                                <a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">Confirm Interview</a>
                            </p>
                            <p>If you do not confirm within the specified time, the interview request will expire.</p>
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

        res.status(200).json({
            message: 'Confirmation request sent, awaiting candidate response.',
            isSuccess: true,
        });

    } catch (error) {
        console.error('Error sending confirmation request:', error);
        res.status(500).json({
            message: 'Failed to send confirmation request',
            isSuccess: false,
        });
    }
};



// Endpoint to handle interview confirmation
const confirmRequest = async(req, res) => {
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

const getInterviewCandidates = async(req, res) => {
    try {
        const authorId = req.params.id; // Assuming this is the author's user ID

        if (!mongoose.Types.ObjectId.isValid(authorId)) {
            return res.status(400).json({
                message: 'Invalid author ID format',
                data: null,
                isSuccess: false,
            });
        }

        // Find job posts created by the author
        const posts = await Post.find({ "author.id": authorId }, "_id title");

        if (posts.length === 0) {
            return res.status(404).json({
                message: 'No job posts found for this author',
                data: [],
                isSuccess: false,
            });
        }

        // Extract post IDs
        const postIds = posts.map(post => post._id);

        // Find job statuses with "Interview" status for those posts
        const jobStatusItems = await JobStatus.find({
            postid: { $in: postIds },
            status: { $in: ["Interview", "Reschedule Requested"] },
        });

        if (jobStatusItems.length === 0) {
            return res.status(404).json({
                message: 'No candidates with "Interview" status found',
                data: [],
                isSuccess: false,
            });
        }

        // Fetch detailed candidate information
        const candidates = await Promise.all(jobStatusItems.map(async(jobStatus) => {
            const user = await User.findById(jobStatus.userid, "firstName lastName email");
            const post = posts.find(p => p._id.equals(jobStatus.postid));
            return {
                user,
                jobTitle: post ? post.title : "Unknown",
                postId: jobStatus.postid, // Thêm trường postId
                cv: jobStatus.cvUrl,
                coverLetter: jobStatus.coverLetter,
                status: jobStatus.status,
                interviewDate: jobStatus.interviewDate || new Date()
            };
        }));

        return res.status(200).json({
            message: 'Interview candidates fetched successfully',
            data: candidates,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error fetching interview candidates:', error);
        res.status(500).json({
            message: 'Failed to fetch interview candidates',
            data: null,
            isSuccess: false,
        });
    }
};


// Function to schedule an interview
const scheduleInterview = async(req, res) => {
    const { postId, candidateId, interviewDate } = req.body;

    try {
        console.log(interviewDate);
        // Cập nhật thông tin phỏng vấn
        const jobStatus = await JobStatus.findOneAndUpdate({ postid: postId, userid: candidateId }, {
            $set: {
                interviewDate,
                status: 'Interview Scheduled'
            }
        }, { new: true });

        if (!jobStatus) {
            return res.status(404).json({
                message: 'Job application not found',
                isSuccess: false
            });
        }

        // Lấy thông tin ứng viên
        const candidate = await User.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({
                message: 'Candidate not found',
                isSuccess: false
            });
        }

        // Tạo đường link chấp nhận và dời lịch
        const acceptUrl = `${process.env.FRONTEND_URL}/interview/accept/${jobStatus._id}`;
        const rescheduleUrl = `${process.env.FRONTEND_URL}/interview/reschedule/${jobStatus._id}`;

        // Thiết lập gửi email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Company" <${process.env.EMAIL_USER}>`,
            to: candidate.email,
            subject: 'Interview Schedule Notification',
            html: `
                <div style="background-color: #f9f9f9; padding: 20px; font-family: Arial, sans-serif;">
                    <table align="center" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                        <tr>
                            <td style="text-align: center; padding-bottom: 20px;">
                                <h2 style="color: #333333; margin-bottom: 0;">Interview Schedule Notification</h2>
                                <p style="color: #666666; margin-top: 5px;">You have a new interview scheduled</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                                <p>Dear ${candidate.firstName},</p>
                                <p>We are pleased to inform you that you have been scheduled for an interview. Below are the details:</p>
                                <p><strong>Date and Time:</strong> ${new Date(interviewDate).toLocaleString()}</p>
                                <p>Please confirm your participation or request a reschedule using one of the options below:</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; padding: 20px;">
                                <a href="${acceptUrl}" style="background-color: #28a745; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; margin-right: 10px; display: inline-block;">Accept Interview</a>
                                <a href="${rescheduleUrl}" style="background-color: #ff9800; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">Reschedule Interview</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-top: 20px; font-size: 14px; color: #888888; text-align: center; border-top: 1px solid #eeeeee;">
                                <p>If you have any questions, feel free to contact us at support@company.com.</p>
                                <p>Best regards,<br><strong>Company Hiring Team</strong></p>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; font-size: 12px; color: #aaaaaa; padding-top: 20px;">
                                <p>© ${new Date().getFullYear()} Company. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </div>
            `
        };

        // Gửi email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: 'Interview scheduled and notification sent to candidate',
            isSuccess: true,
            data: jobStatus
        });
    } catch (error) {
        console.error('Error scheduling interview:', error);
        res.status(500).json({
            message: 'Failed to schedule interview',
            isSuccess: false
        });
    }
};
const acceptInterview = async(req, res) => {
    const { jobStatusId } = req.params;
    console.log(jobStatusId);
    try {
        console.log("Accepting interview for Job Status ID:", jobStatusId);
        const jobStatus = await JobStatus.findById(jobStatusId);
        if (!jobStatus) {
            return res.status(404).json({
                message: 'Job status not found',
                isSuccess: false
            });
        }

        if (jobStatus.status !== 'Interview Scheduled') {
            return res.status(400).json({
                message: 'Hành động không hợp lệ!',
                isSuccess: false
            });
        }

        jobStatus.status = 'Interview Confirmed';
        await jobStatus.save();

        // Lấy thông tin ứng viên và công ty
        const candidate = await User.findById(jobStatus.userid);
        const company = await Company.findById(jobStatus.companyid);

        // Tạo đường link gọi video
        const videoCallUrl = `http://localhost:4000/call/${candidate._id}/${company._id}`;

        // Gửi email xác nhận
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Company" <${process.env.EMAIL_USER}>`,
            to: candidate.email,
            subject: 'Interview Confirmation',
            html: `
                <div style="background-color: #f9f9f9; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #333333;">Interview Confirmation</h2>
                    <p>Dear ${candidate.firstName},</p>
                    <p>You have successfully confirmed the interview. Below are the details:</p>
                    <p><strong>Date and Time:</strong> ${new Date(jobStatus.interviewDate).toLocaleString()}</p>
                    <p>Click the link below to join the video call at the scheduled time:</p>
                    <a href="${videoCallUrl}" style="background-color: #28a745; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px;">Join Video Call</a>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: 'Interview accepted and confirmation email sent',
            isSuccess: true,
            data: jobStatus
        });
    } catch (error) {
        console.error('Error accepting interview:', error);
        res.status(500).json({
            message: 'Failed to accept interview',
            isSuccess: false
        });
    }
};


// Function to reschedule the interview
const rescheduleInterview = async(req, res) => {
    const { jobStatusId } = req.params;
    const { newDate } = req.body;

    try {
        console.log("Rescheduling interview for Job Status ID:", jobStatusId);
        const jobStatus = await JobStatus.findById(jobStatusId);

        if (!jobStatus) {
            return res.status(404).json({
                message: 'Job status not found',
                isSuccess: false
            });
        }

        console.log("Current status:", jobStatus.status);
        // Kiểm tra xem trạng thái hiện tại có phải là "Interview Scheduled" không
        if (jobStatus.status !== 'Interview Scheduled') {
            return res.status(400).json({
                message: 'Hành động không hợp lệ!',
                isSuccess: false
            });
        }

        // Cập nhật trạng thái thành "Reschedule Requested"
        jobStatus.status = 'Reschedule Requested';
        await jobStatus.save();

        // Phản hồi thành công
        res.status(200).json({
            message: 'Reschedule request submitted',
            isSuccess: true,
            data: jobStatus
        });
    } catch (error) {
        console.error('Error rescheduling interview:', error);
        res.status(500).json({
            message: 'Failed to reschedule interview',
            isSuccess: false
        });
    }
};

const getInterviewConfirmedCandidates = async(req, res) => {
    try {
        const authorId = req.params.id; // ID của công ty

        if (!mongoose.Types.ObjectId.isValid(authorId)) {
            return res.status(400).json({
                message: 'Invalid author ID format',
                data: null,
                isSuccess: false,
            });
        }

        // Tìm các bài đăng do công ty tạo
        const posts = await Post.find({ "author.id": authorId }, "_id title");

        if (posts.length === 0) {
            return res.status(404).json({
                message: 'No job posts found for this author',
                data: [],
                isSuccess: false,
            });
        }

        // Lấy các ID bài đăng
        const postIds = posts.map(post => post._id);

        // Tìm các trạng thái công việc có status "Interview Confirmed"
        const jobStatusItems = await JobStatus.find({
            postid: { $in: postIds },
            status: "Interview Confirmed",
        });

        if (jobStatusItems.length === 0) {
            return res.status(404).json({
                message: 'No candidates with "Interview Confirmed" status found',
                data: [],
                isSuccess: false,
            });
        }

        // Lấy thông tin ứng viên, phòng phỏng vấn và companyKey
        const candidates = await Promise.all(jobStatusItems.map(async(jobStatus) => {
            const user = await User.findById(jobStatus.userid, "firstName lastName email");
            const post = posts.find(p => p._id.equals(jobStatus.postid));
            const room = await Room.findOne({ "name": `${jobStatus.userid.toString()}-${jobStatus.companyid.toString()}` });
            return {
                user,
                jobTitle: post ? post.title : "Unknown",
                postId: jobStatus.postid,
                cv: jobStatus.cvUrl,
                coverLetter: jobStatus.coverLetter,
                status: jobStatus.status,
                interviewDate: jobStatus.interviewDate || null,
                roomKey: room ? room.userkey : null, // Hoặc sử dụng companykey tùy nhu cầu
                companyKey: room ? room.companykey : null, // Thêm companyKey vào đối tượng ứng viên
            };
        }));

        return res.status(200).json({
            message: 'Interview confirmed candidates fetched successfully',
            data: candidates,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error fetching interview confirmed candidates:', error);
        res.status(500).json({
            message: 'Failed to fetch interview confirmed candidates',
            data: null,
            isSuccess: false,
        });
    }
};

module.exports = {
    getJobstatusDetails,
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
    requestConfirmation,
    confirmRequest,
    getInterviewCandidates,
    scheduleInterview,
    acceptInterview,
    rescheduleInterview,
    getInterviewConfirmedCandidates
};