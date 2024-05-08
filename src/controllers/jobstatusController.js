const { ObjectId } = require("mongodb");
const { db } = require("../utils/connectDb");

const getJobStatus = async (req, res) => {
    try {
        const { postid, userid } = req.body;
        if (!ObjectId.isValid(postid) || !ObjectId.isValid(userid)) {
            return res.status(400).json({
                message: 'Invalid post ID or user ID format',
                data: null,
                isSuccess: false,
            });
        }
        const jobstatus = await db.jobstatus.find({
            postid: new ObjectId(postid),
            userid: new ObjectId(userid),
        }).toArray();
        if (!jobstatus) {
            return res.status(404).json({
                message: 'Job status not found',
                data: null,
                isSuccess: false,
            });
        }
        return res.status(200).json({
            message: 'Get job status successful',
            data: jobstatus,
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
const updateJobStatus = async (req, res) => {
    const { status, candidateInfo } = req.body;
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid job status ID format',
                data: null,
                isSuccess: false,
            });
        }
        await db.jobStatus.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status,
                    candidateInfo,
                },
            }
        )
        res.status(200).json({
            message: "Update job status by id successful",
            data: { ...req.body, id: id },
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
const createJobStatus = async (req, res) => {
    const { postid, userid, status, candidateInfo } = req.body;
    console.log(candidateInfo);
    try {
        const existingJobStatus = await db.jobstatus.findOne({
            postid: new ObjectId(postid),
            userid: new ObjectId(userid),
        });
        if (existingJobStatus && existingJobStatus.status !== 'Denied') {
            return res.status(400).json({
                message: 'You have already applied for this job',
                data: null,
                isSuccess: false,
            });
        }
        const newJobStatus = {
            postid: new ObjectId(postid),
            userid: new ObjectId(userid),
            status,
            candidateInfo,
        };
        const result = await db.jobstatus.insertOne(newJobStatus);
        if (result.acknowledged) {
            res.status(201).json({
                message: "Create job status successful",
                data: { ...req.body, _id: result.insertedId },
                isSuccess: true,
            });
        } else {
            throw new Error('Insert operation not acknowledged');
        }
    } catch (error) {
        console.error('Error creating job status:', error);
        res.status(500).json({
            message: 'Failed to create job status',
            data: null,
            isSuccess: false,
        });
    }
};
const getJobStatusByAuthor = async (req, res) => {
    try {
        const authorid = req.params;
        if (!ObjectId.isValid(authorid)) {
            return res.status(400).json({
                message: 'Invalid user ID format',
                data: null,
                isSuccess: false,
            });
        }
        const posts = await db.posts.find({
            "author._id": new ObjectId(authorid),
        }).toArray();
        for (let post of posts) {
            const jobStatusCount = await db.jobstatus.countDocuments({
                postid: new ObjectId(post._id),
                status: "Applied"
            });
            const jobStatusItem = await db.jobstatus.find({
                postid: new ObjectId(post._id),
                status: "Applied"
            }).toArray();
            post.jobStatusCount = jobStatusCount;
            post.userapply = [];
            for (let job of jobStatusItem) {
                const user = await db.users.findOne({
                    _id: new ObjectId(job.userid),
                });
                const data = {
                    user: user,
                    info: job.candidateInfo,
                    status: job.status,
                }
                post.userapply = [...post.userapply, data];
            }
        }
        return res.status(200).json({
            message: 'Get job status by author successful',
            data: posts,
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
const hireCandidate = async (req, res) => {
    const { postid } = req.body;
    const userid = req.params.id
    console.log(postid)
    console.log(userid)
    if (!ObjectId.isValid(userid) || !ObjectId.isValid(postid)) {
        return res.status(400).json({
            message: 'Invalid user ID or post ID format',
            data: null,
            isSuccess: false,
        });
    }
    try {
        await db.jobstatus.updateOne(
            { userid: new ObjectId(userid), postid: new ObjectId(postid) },
            { $set: { status: 'Hired' } },
        );
        return res.status(200).json({
            message: 'Tuyển thành công',
            data: null,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error hiring candidate:', error);
        res.status(500).json({
            message: 'Tuyển không thành công',
            data: null,
            isSuccess: false,
        });
    }
};
const denyCandidate = async (req, res) => {
    const { postid } = req.body;
    const userid = req.params.id
    if (!ObjectId.isValid(userid) || !ObjectId.isValid(postid)) {
        return res.status(400).json({
            message: 'Invalid user ID or post ID format',
            data: null,
            isSuccess: false,
        });
    }
    try {
        await db.jobstatus.updateOne(
            { userid: new ObjectId(userid), postid: new ObjectId(postid) },
            { $set: { status: 'Denied' } }
        );
        return res.status(200).json({
            message: 'Candidate has been denied successfully',
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
const getUserAppliedPosts = async (req, res) => {
    try {
        const { userId, statusdata } = req.query;
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Invalid user ID format',
                data: null,
                isSuccess: false,
            });
        }
        const jobStatuses = await db.jobstatus.find({
            userid: new ObjectId(userId),
            status: statusdata
        }).toArray();
        let posts = [];
        for (let jobStatus of jobStatuses) {
            const post = await db.posts.findOne({
                _id: new ObjectId(jobStatus.postid),
            });
            if (post) {
                posts.push(post);
                post.status = jobStatus
            }
        }
        console.log(posts)
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
const deleteJobStatus = async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({
            message: 'Invalid job status ID format',
            data: null,
            isSuccess: false,
        });
    }
    try {
        const result = await db.jobstatus.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            res.status(200).json({
                message: 'Delete job status successful',
                data: null,
                isSuccess: true,
            });
        } else {
            throw new Error('Job status not found');
        }
    } catch (error) {
        console.error('Error deleting job status:', error);
        res.status(500).json({
            message: 'Failed to delete job status',
            data: null,
            isSuccess: false,
        });
    }
};
const checkUserApplied = async (req, res) => {
    const { postid, userid } = req.query;
    if (!ObjectId.isValid(postid) || !ObjectId.isValid(userid)) {
        return res.status(400).json({
            message: 'Invalid post ID or user ID format',
            data: null,
            isSuccess: false,
        });
    }
    try {
        const jobstatus = await db.jobstatus.findOne({
            postid: new ObjectId(postid),
            userid: new ObjectId(userid),
        });
        if (!jobstatus || jobstatus.status === 'Denied') {
            return res.status(200).json({
                message: 'User has not applied or was denied',
                data: null,
                isSuccess: true,
            });
        } else {
            return res.status(200).json({
                message: 'User has already applied',
                data: jobstatus,
                isSuccess: true,
            });
        }
    } catch (error) {
        console.error('Error checking user application:', error);
        res.status(500).json({
            message: 'Failed to check user application',
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
    checkUserApplied
};

