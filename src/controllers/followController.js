const mongoose = require('mongoose');
const Follow = require('../models/Follow');

// Controller to follow a user
const followUser = async (req, res) => {
  try {
    const { userId, followId } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(followId)) {
      return res.status(400).json({
        message: 'Invalid user ID or follow ID format',
        isSuccess: false,
      });
    }

    // Check if the user is already following
    const existingFollow = await Follow.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      followId: new mongoose.Types.ObjectId(followId),
    });

    if (existingFollow) {
      return res.status(400).json({
        message: "You are already following this user",
        isSuccess: false,
      });
    }

    // Create a new follow document
    const newFollow = new Follow({
      userId: new mongoose.Types.ObjectId(userId),
      followId: new mongoose.Types.ObjectId(followId),
    });

    await newFollow.save();

    res.status(200).json({
      message: "Followed user successfully",
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({
      message: 'Failed to follow user',
      isSuccess: false,
    });
  }
};

// Controller to unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const { userId, followId } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(followId)) {
      return res.status(400).json({
        message: 'Invalid user ID or follow ID format',
        isSuccess: false,
      });
    }

    // Delete the follow document
    await Follow.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      followId: new mongoose.Types.ObjectId(followId),
    });

    res.status(200).json({
      message: "Unfollowed user successfully",
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({
      message: 'Failed to unfollow user',
      isSuccess: false,
    });
  }
};

// Controller to get followers of a user
const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        data: null,
        isSuccess: false,
      });
    }

    // Fetch followers and count
    const followers = await Follow.find({ followId: new mongoose.Types.ObjectId(userId) }).exec();
    const followersCount = await Follow.countDocuments({ followId: new mongoose.Types.ObjectId(userId) });

    res.status(200).json({
      message: "Get followers successful",
      data: { followers: followers || [], followersCount: followersCount || 0 },
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({
      message: 'Failed to get followers',
      data: null,
      isSuccess: false,
    });
  }
};

// Controller to get following of a user
const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        data: null,
        isSuccess: false,
      });
    }

    // Fetch following and count
    const following = await Follow.find({ userId: new mongoose.Types.ObjectId(userId) }).exec();
    const followingCount = await Follow.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });

    res.status(200).json({
      message: "Get following successful",
      data: { following: following || [], followingCount: followingCount || 0 },
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({
      message: 'Failed to get following',
      data: null,
      isSuccess: false,
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};