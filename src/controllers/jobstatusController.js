const mongoose = require('mongoose');
const JobStatus = require('../models/JobStatus'); // Your Mongoose model for JobStatus
const Post = require('../models/Post'); // Your Mongoose model for Post
const User = require('../models/User'); // Your Mongoose model for User

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
    const { postid, userid, status, candidateInfo } = req.body;
    try {
        const existingJobStatus = await JobStatus.findOne({
            postid,
            userid,
        });
        if (existingJobStatus && existingJobStatus.status !== 'Denied') {
            return res.status(400).json({
                message: 'You have already applied for this job',
                data: null,
                isSuccess: false,
            });
        }
        const newJobStatus = new JobStatus({
            postid,
            userid,
            status,
            candidateInfo,
        });
        const savedJobStatus = await newJobStatus.save();
        res.status(201).json({
            message: "Create job status successful",
            data: savedJobStatus,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error creating job status:', error);
        res.status(500).json({
            message: 'Failed to create job status',
            data: null,
            isSuccess: false,
        });
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

            const jobStatusItems = await JobStatus.find({
                postid: post._id,
                status: "Applied",
            });

            // Prepare array to store job applications details
            const userapply = await Promise.all(jobStatusItems.map(async(job) => {
                const user = await User.findById(job.userid);
                return {
                    user,
                    info: job.candidateInfo,
                    status: job.status,
                };
            }));

            // Return modified post object
            return {
                ...post.toObject(), // Convert post to plain JS object
                jobStatusCount,
                userapply,
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

const getUserAppliedPosts = async(req, res) => {
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
            data: jobStatus || 'User has not applied or was denied',
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

module.exports = {
    getJobStatus,
    updateJobStatus,
    createJobStatus,
    getJobStatusByAuthor,
    hireCandidate,
    denyCandidate,
    getUserAppliedPosts,
    deleteJobStatus,
    checkUserApplied,
};