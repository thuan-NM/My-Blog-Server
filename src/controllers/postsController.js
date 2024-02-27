const { ObjectId } = require("mongodb");

const { db } = require("../utils/connectDb");

// GET posts
const getPosts = async (req, res) => {
  try {
    const [posts, totalCount] = await Promise.all([
      db.posts.find({}).sort({ createdAt: -1 }).toArray(),
      db.posts.countDocuments({}),
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

// GET post by id
const getPostById = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await db.posts.findOne({
      _id: new ObjectId(id),
    });
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

const getPostByUserId = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const skip = (page -1) * pageSize;
    const userid = req.params.id;

    // Kiểm tra xem userid có tồn tại không
    if (!userid) {
      return res.status(400).json({
        message: "User ID is required",
        isSuccess: false,
      });
    }

    const [posts, totalCount] = await Promise.all([
      db.posts.find({
        "author._id": new ObjectId(userid),}).toArray(),
      db.posts.countDocuments(db.posts.find({"author._id": new ObjectId(userid),})),
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
const createPost = async (req, res) => {
  try {
    const { title, description, skills,typeOfJob,price,experience } = req.body;
    if (description === null || !skills || !title|| !price || !typeOfJob|| !experience) {
      return res.status(400).json({
        message: "All fields are required",
        isSuccess: 0,
      });
    }

    // Get the user ID from the request (you might need to modify this based on your authentication mechanism)
    const userId = req.body.user._id;

    // Extend the pipeline to get the user's information
    const pipeline = [
      {
        $match: {
          _id: new ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'users', // The name of the collection to perform the lookup
          localField: '_id',
          foreignField: '_id',
          as: 'user_info',
        },
      },
      {
        $unwind: '$user_info',
      },
      {
        $project: {
          'user_info.password': 0,
          'user_info.friend': 0,
          'user_info.friendRequests': 0,
          'user_info.username': 0,// Exclude sensitive information if needed
        },
      },
    ];

    const [user] = await db.users.aggregate(pipeline).toArray();

    // Create the post object with the required information
    const post = {
      title,
      description,
      createdAt: new Date(),
      author: {
        _id: new ObjectId(userId),
        userdata: user.user_info,
        // Add other user information as needed
      },
      skills,
      typeOfJob,
      price,
      experience,
    };

    // Insert the post into the "posts" collection
    await db.posts.insertOne(post);

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
const updatePost = async (req, res) => {
  const { title, content, author, hashtags } = req.body;
  try {
    const id = req.params.id;
    await db.posts.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          title: title,
          content: content,
          author: author,
          hashtags: hashtags,
        },
      }
    );
    res.status(200).json({
      message: "Update post by id successful",
      data: { ...req.body, id: id },
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
const deletePost = async (req, res) => {
  try {
    const id = req.params.id;
    await db.posts.deleteOne({
      _id: new ObjectId(id),
    });
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

const searchPosts = async (req, res) => {
  try {
    const query = req.query.searchTerm;
    const searchResults = await db.posts.find({
      $or: [
        { content: { $regex: query, $options: "i" } },
        { title: { $regex: query, $options: "i" } },
        { hashtags: { $regex: query, $options: "i" } },
        { author: { $regex: query, $options: "i" } },
      ],
    }).toArray();

    res.status(200).json({
      message: "Search users successful",
      data: searchResults,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      message: 'Failed to search users',
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
};