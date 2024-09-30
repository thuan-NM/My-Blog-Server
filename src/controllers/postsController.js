const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Reaction = require('../models/Reaction');
const User = require('../models/User')
    // GET posts
const getPosts = async(req, res) => {
    try {
        const [posts, totalCount] = await Promise.all([
            Post.find({}).sort({ createdAt: -1 }).limit(50),
            Post.countDocuments({}),
        ]);

        res.status(200).json({
            message: "Get post list successful",
            data: posts,
            totalCount,
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: null,
            isSuccess: false,
        });
    }
};

// GET filtered posts
const getFilterPost = async(req, res) => {
    try {
        const filter = req.body;
        const lowercaseSkills = filter.skills.map(skill => skill);
        const query = {};

        if (lowercaseSkills.length > 0 && lowercaseSkills[0] !== "") {
            query.skills = { $in: lowercaseSkills };
        }
        if (!isNaN(filter.minInputValue) && !isNaN(filter.maxInputValue) && filter.minInputValue !== null && filter.maxInputValue !== null) {
            query.price = {
                $gte: parseFloat(filter.minInputValue),
                $lte: parseFloat(filter.maxInputValue)
            };
        }
        if (filter.location && filter.location !== "") {
            query.country = filter.location;
        }
        if (filter.workType && filter.workType !== "") {
            query.workType = filter.workType;
        }

        console.log("query :", query)
        const [posts, totalCount] = await Promise.all([
            Post.find(query).sort({ createdAt: -1 }).limit(20),
            Post.countDocuments(query)
        ]);

        console.log(posts)
        res.status(200).json({
            message: "Get post list successful",
            data: posts,
            totalCount: totalCount,
            isSuccess: true
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: null,
            isSuccess: false
        });
    }
}

// GET post by id
const getPostById = async(req, res) => {
    try {
        const id = req.params.id;
        const post = await Post.findById(id);

        res.status(200).json({
            message: "Get post detail by id successful",
            data: post,
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: null,
            isSuccess: false,
        });
    }
};

// GET posts by user id with pagination
const getPostByUserId = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 5;
        const skip = (page - 1) * pageSize;
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
                isSuccess: false,
            });
        }

        const [posts, totalCount] = await Promise.all([
            Post.find({ "author._id": userId }).skip(skip).limit(pageSize),
            Post.countDocuments({ "author._id": userId }),
        ]);

        const totalPages = Math.ceil(totalCount / pageSize);

        res.status(200).json({
            message: "Get post list successful",
            data: posts,
            page,
            pageSize,
            totalPages,
            totalCount,
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: null,
            isSuccess: false,
        });
    }
};

// CREATE new post
const createPost = async(req, res) => {
    try {
        const { title, description, skills, typeOfJob, price, experience, workType } = req.body;

        if (!title || !description || !skills || !price || !typeOfJob || !experience || !workType) {
            return res.status(400).json({
                message: "All fields are required",
                isSuccess: false,
            });
        }

        const userId = req.body.user._id;
        const user = await User.findById(userId).select('-password -friend -friendRequests -username');
        const UppercaseSkills = skills.map(skill => skill.toUpperCase());

        const post = new Post({
            title: title.toUpperCase(),
            description: description.toUpperCase(),
            author: {
                _id: userId,
                userdata: user
            },
            skills: UppercaseSkills,
            typeOfJob: typeOfJob.toUpperCase(),
            price: parseFloat(price),
            experience: experience.toUpperCase(),
            workType: workType.toUpperCase(),
        });

        await post.save();

        res.status(201).json({
            message: "Create a post successfully",
            data: post,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            message: 'Failed to create post',
            data: null,
            isSuccess: false,
        });
    }
};

// UPDATE post
const updatePost = async(req, res) => {
    const { title, content, author, hashtags } = req.body;
    try {
        const id = req.params.id;
        const post = await Post.findByIdAndUpdate(id, {
            title,
            content,
            author,
            hashtags,
        }, { new: true });

        res.status(200).json({
            message: "Update post by id successful",
            data: post,
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: null,
            isSuccess: false,
        });
    }
};

// DELETE post by id
const deletePost = async(req, res) => {
    try {
        const id = req.params.id;
        await Post.findByIdAndDelete(id);

        res.status(200).json({
            message: "Delete post by id successful",
            data: { id },
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: null,
            isSuccess: false,
        });
    }
};

// SEARCH posts
const searchPosts = async(req, res) => {
    try {
        const query = req.query.searchTerm;
        const searchResults = await Post.find({
            $or: [
                { content: { $regex: query, $options: "i" } },
                { title: { $regex: query, $options: "i" } },
                { hashtags: { $regex: query, $options: "i" } },
                { "author.userdata.username": { $regex: query, $options: "i" } },
            ],
        });

        res.status(200).json({
            message: "Search posts successful",
            data: searchResults,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({
            message: 'Failed to search posts',
            data: null,
            isSuccess: false,
        });
    }
};

// GET top posts by reactions
const getTopPosts = async(req, res) => {
    try {
        const topPostIds = await Reaction.aggregate([
            { $group: { _id: "$postId", totalReactions: { $sum: 1 } } },
            { $sort: { totalReactions: -1 } },
            { $limit: 5 },
        ]).exec();

        const topPostIdsArray = topPostIds.map((item) => item._id);
        const topPosts = await Post.find({ _id: { $in: topPostIdsArray } });

        res.status(200).json({
            message: "Get top posts successful",
            data: topPosts,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error getting top posts:', error);
        res.status(500).json({
            message: 'Failed to get top posts',
            data: null,
            isSuccess: false,
        });
    }
};

// GET most commented posts
const getMostInterestPosts = async(req, res) => {
    try {
        const topPostIds = await Comment.aggregate([
            { $group: { _id: "$postId", totalComments: { $sum: 1 } } },
            { $sort: { totalComments: -1 } },
            { $limit: 5 },
        ]).exec();

        const topPostIdsArray = topPostIds.map((item) => item._id);
        const topPosts = await Post.find({ _id: { $in: topPostIdsArray } });

        res.status(200).json({
            message: "Get most commented posts successful",
            data: topPosts,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error getting most commented posts:', error);
        res.status(500).json({
            message: 'Failed to get most commented posts',
            data: null,
            isSuccess: false,
        });
    }
};

const getRelatedPosts = async(req, res) => {
    try {
        const postId = req.params.id;

        // Tìm bài post theo id để lấy danh sách skills
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found",
                isSuccess: false,
            });
        }

        const postSkills = post.skills;

        // Tìm các bài post có ít nhất một skill giống với bài post ban đầu
        const relatedPosts = await Post.find({
            _id: { $ne: postId }, // Loại bỏ post ban đầu khỏi kết quả
            skills: { $in: postSkills }, // Tìm bài post có skill trùng
        }).limit(4); // Giới hạn kết quả trả về là 4 bài post

        res.status(200).json({
            message: "Get related posts successful",
            data: relatedPosts,
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: null,
            isSuccess: false,
        });
    }
};

module.exports = {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    searchPosts,
    getPostByUserId,
    getFilterPost,
    getTopPosts,
    getMostInterestPosts,
    getRelatedPosts,
};