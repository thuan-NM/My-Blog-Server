const { ObjectId } = require("mongodb");
const { db } = require("../utils/connectDb");

//get all
const getComment = (req, res) => {};

//get cmt by id
const getCommentByPostId = async (req, res) => {
    try {
      const postId = req.params;
      const comments = await db.comments.find({ postId: new ObjectId(postId) })
        .sort({ createdAt: 1 }) // Sort in descending order based on createdAt
        .toArray();
      
      const totalComments = await db.comments.countDocuments({
          postId: new ObjectId(postId),
      });
      res.status(200).json({
        message: "Comments retrieved successfully",
        data: {comments,totalComments},
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
  
  
//create
const createComment = async (req, res) => {
    try {
      const userId  = req.body.user;
      const now = new Date();
      const dateString = now.toISOString();
      const { postId, content } = req.body;
      if (content === "") {
        return res.status(400).json({
          message: "All fields are required",
          isSuccess: 0,
        });
      }
      const newComment = {
        postId: new ObjectId(postId), // Convert postId to ObjectId
        content,
        author: userId,
        createdAt: dateString,
      };
  
      await db.comments.insertOne(newComment);
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
  

//put cmt by id
const editComment = async (req, res) => {
  try {
    const { content } = req.body;
    const id = req.params;
    const newComment = {
      content,
    };
    await db.comments.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        newComment,
      }
    );
    res.status(201).json({
      msg: "Update comment successful",
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

//delete comment
const deleteComment = async (req, res) => {
  try {
    await db.comments.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.status(200).json({
      msg: "Comment has deleted successful",
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