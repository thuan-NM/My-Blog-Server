const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Reaction = require('../models/Reaction');
const Company = require('../models/Company');
const NodeCache = require('node-cache');
const geocodeCache = new NodeCache({ stdTTL: 86400 }); // Cache for 1 day
const axios = require('axios');
require('dotenv').config();

// preprocess
const preprocessLocation = (location) => {
    // Split the address using common delimiters
    const addressParts = location.split(/,|\n|;/).map(part => part.trim());

    // Prioritize components (you can adjust this logic)
    const components = [];
    if (addressParts.length > 0) components.push(addressParts[addressParts.length - 1]); // Country
    if (addressParts.length > 1) components.unshift(addressParts[addressParts.length - 2]); // State/Province
    if (addressParts.length > 2) components.unshift(addressParts[addressParts.length - 3]); // City

    const reconstructedAddress = components.join(', ');

    // Ensure the reconstructed address is within 256 characters
    return reconstructedAddress.substring(0, 256);
};

const getCoordinates = async (address) => {
    if (!address) {
        console.error('No address provided for geocoding.');
        return null;
    }

    // Preprocess the address
    const preprocessedAddress = preprocessLocation(address);

    if (!preprocessedAddress) {
        console.error(`Preprocessing failed for address: ${address}`);
        return null;
    }

    // Check cache first
    const cachedData = geocodeCache.get(preprocessedAddress);
    if (cachedData) {
        return cachedData;
    }

    const apiKey = process.env.GEOCODING_API_KEY;
    const encodedAddress = encodeURIComponent(preprocessedAddress);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.features && response.data.features.length > 0) {
            const [longitude, latitude] = response.data.features[0].geometry.coordinates;
            const locationData = {
                coordinates: [longitude, latitude], // [longitude, latitude]
                address: response.data.features[0].place_name,
            };
            // Cache the result
            geocodeCache.set(preprocessedAddress, locationData);
            return locationData;
        } else {
            console.error(`Address not found for: ${preprocessedAddress}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching coordinates for address: ${preprocessedAddress}`, error.message);
        return null;
    }
};

// GET posts
const getPosts = async(req, res) => {
    try {
        const [posts, totalCount] = await Promise.all([
            Post.find({}).sort({ createdAt: -1 }).limit(20),
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

const getFilterPost = async (req, res) => {
    try {
        const filter = req.body;
        const query = {};
        let sortOption = { createdAt: -1 }; // Default sort by newest

        // 1. Filter by skills (case-insensitive) with optimized regex
        if (filter.skills && Array.isArray(filter.skills) && filter.skills.length > 0 && filter.skills[0].trim() !== "") {
            // Sanitize and escape each skill to prevent regex injection
            const sanitizedSkills = filter.skills
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0)
                .map(skill => skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Escape special regex characters

            if (sanitizedSkills.length > 0) {
                // Combine all skills into a single regex pattern using OR (|)
                const regexPattern = sanitizedSkills.join("|");
                query.skills = { $regex: regexPattern, $options: 'i' }; // Case-insensitive
            }
        }

        // 2. Filter by price range
        if (
            typeof filter.minInputValue === 'number' &&
            typeof filter.maxInputValue === 'number' &&
            filter.minInputValue !== null &&
            filter.maxInputValue !== null
        ) {
            query.price = {
                $gte: parseFloat(filter.minInputValue),
                $lte: parseFloat(filter.maxInputValue)
            };
        }

        // 3. Filter by work type (case-insensitive)
        if (filter.workType && filter.workType.trim() !== "") {
            query.workType = { $regex: new RegExp(`^${filter.workType.trim()}$`, 'i') };
        }

        // 4. Filter by company name (case-insensitive)
        if (filter.companyName && filter.companyName.trim() !== "") {
            query["author.userdata.companyname"] = { $regex: new RegExp(filter.companyName.trim(), 'i') };
        }

        // 5. If location filter is provided, add $near to the query
        if (filter.location && filter.location.trim() !== "") {
            // Get user's coordinates from the provided location
            const locationData = await getCoordinates(filter.location); // { coordinates: [lng, lat], address: "..." }

            if (!locationData || !Array.isArray(locationData.coordinates) || locationData.coordinates.length !== 2) {
                throw new Error("Invalid coordinates received from geocoding service for user's location.");
            }

            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: locationData.coordinates
                    },
                    $maxDistance: 20000 // 20 km, bạn có thể điều chỉnh tùy ý
                }
            };
        }

        // 6. Apply initial filters to get a set of posts
        let mongoQuery = Post.find(query).sort(sortOption).limit(100); // Adjust limit as needed

        // 7. If sorting by most likes, adjust sorting
        if (filter.sortBy === "mostLikes") {
            // Get the reaction counts for the filtered posts
            const postIds = await Post.find(query).select('_id').limit(100).lean();
            const ids = postIds.map(post => post._id);

            const reactions = await Reaction.aggregate([
                { $match: { postId: { $in: ids } } },
                { $group: { _id: "$postId", totalReactions: { $sum: 1 } } },
            ]);

            // Create a mapping of postId to totalReactions
            const reactionsMap = {};
            reactions.forEach(item => {
                reactionsMap[item._id.toString()] = item.totalReactions;
            });

            // Fetch posts and sort them based on totalReactions
            const posts = await mongoQuery.lean(); // Get lean documents

            filteredPosts = posts.map(post => ({
                ...post,
                totalReactions: reactionsMap[post._id.toString()] || 0
            })).sort((a, b) => b.totalReactions - a.totalReactions).slice(0, 20); // Limit to 20

            const totalCount = filteredPosts.length;

            res.status(200).json({
                message: "Get post list successful",
                data: filteredPosts,
                totalCount: totalCount,
                isSuccess: true
            });
            return;
        }

        // 8. Limit the number of posts returned
        const filteredPosts = await mongoQuery.lean();
        const totalCount = filteredPosts.length;

        res.status(200).json({
            message: "Get post list successful",
            data: filteredPosts,
            totalCount: totalCount,
            isSuccess: true
        });
    } catch (error) {
        console.error('Error in getFilterPost:', error);
        res.status(500).json({
            message: error.message,
            data: null,
            isSuccess: false
        });
    }
};


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

// GET posts by company id with pagination
const getPostByCompanyId = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 5;
        const skip = (page - 1) * pageSize;
        const companyId = req.params.id;

        if (!companyId) {
            return res.status(400).json({
                message: "Company ID is required",
                isSuccess: false,
            });
        }

        const [posts, totalCount] = await Promise.all([
            Post.find({ "author.id": companyId }).skip(skip).limit(pageSize),
            Post.countDocuments({ "author.id": companyId }),
        ]);

        const totalPages = Math.ceil(totalCount / pageSize);

        res.status(200).json({
            message: "Get post list by company ID successful",
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
const createPost = async (req, res) => {
    try {
        const { title, description, skills, price, workType, location } = req.body;

        if (!title || !description || !skills || !price || !workType || !location) {
            return res.status(400).json({
                message: "All fields are required",
                isSuccess: false,
            });
        }

        const companyId = req.body.author.id; // Assuming the user's ID is available in req.user
        const company = await Company.findById(companyId).select('-password -friend -friendRequests -username');
        const uppercaseSkills = skills.map(skill => skill.toUpperCase());

        // Get coordinates from the address
        const locationData = await getCoordinates(location);

        if (!locationData) {
            return res.status(400).json({
                message: "Invalid location provided",
                isSuccess: false,
            });
        }

        const post = new Post({
            title: title.toUpperCase(),
            description: description,
            author: {
                id: companyId,
                userdata: company
            },
            skills: uppercaseSkills,
            price: parseFloat(price),
            workType: workType.toUpperCase(),
            location: {
                type: 'Point',
                coordinates: locationData.coordinates, // [longitude, latitude]
                address: location,
            },
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

        // Tạo một mảng các điều kiện so sánh bằng regex để không phân biệt hoa thường
        const skillRegexQueries = postSkills.map(skill => ({
            skills: { $regex: new RegExp(skill, 'i') } // Tạo regex không phân biệt hoa thường
        }));

        // Tìm các bài post có ít nhất một skill giống với bài post ban đầu
        const relatedPosts = await Post.find({
            _id: { $ne: postId }, // Loại bỏ post ban đầu khỏi kết quả
            $or: skillRegexQueries, // Tìm bài post có skill trùng bằng regex không phân biệt hoa thường
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
    getPostByCompanyId,
    getFilterPost,
    getTopPosts,
    getMostInterestPosts,
    getRelatedPosts,
};