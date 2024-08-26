const Comment = require('../models/Comment');
const User = require('../models/User')
const mongoose = require('mongoose');

// GET all comments
const getComment = async (req, res) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 }); // Sorting in descending order

    res.status(200).json({
      message: "All comments retrieved successfully",
      data: comments,
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

// GET comments by Post ID
const getCommentByPostId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid post ID format',
        data: null,
        isSuccess: false,
      });
    }

    const comments = await Comment.find({ postId: new mongoose.Types.ObjectId(id) })
      .sort({ createdAt: 1 });

    const totalComments = await Comment.countDocuments({ postId: new mongoose.Types.ObjectId(id) });
    res.status(200).json({
      message: "Comments retrieved successfully",
      data: { comments, totalComments },
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

// CREATE a new comment
const createComment = async (req, res) => {
  try {
    const { postId, content, user } = req.body;
    const test =(user)
    console.log(test)
    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Content is required",
        isSuccess: false,
      });
    }

    const newComment = new Comment({
      postId: new mongoose.Types.ObjectId(postId),
      content,
      author: new User(user),
    });

    await newComment.save();

    res.status(201).json({
      message: "Comment created successfully",
      data: newComment,
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

// UPDATE comment by ID
const editComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { id } = req.params;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Content is required",
        isSuccess: false,
      });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      { content },
      { new: true }
    );

    if (!updatedComment) {
      return res.status(404).json({
        message: "Comment not found",
        data: null,
        isSuccess: false,
      });
    }

    res.status(200).json({
      message: "Update comment successful",
      data: updatedComment,
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

// DELETE comment by ID
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      return res.status(404).json({
        message: "Comment not found",
        isSuccess: false,
      });
    }

    res.status(200).json({
      message: "Comment deleted successfully",
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
  getComment,
  getCommentByPostId,
  createComment,
  editComment,
  deleteComment,
};
