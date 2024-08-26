const mongoose = require("mongoose");
const cloudinary = require('cloudinary').v2;
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const getUsers = async (req, res) => {
  try {
    const users = await User.find().exec();

    res.status(200).json({
      message: "Get users list successful",
      data: users,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      message: 'Failed to fetch users',
      data: null,
      isSuccess: false,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        data: null,
        isSuccess: false,
      });
    }

    const user = await User.findById(id).exec();
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        data: null,
        isSuccess: false,
      });
    }

    return res.status(200).json({
      message: 'Get user detail by ID successful',
      data: user,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({
      message: 'Failed to fetch user by ID',
      data: null,
      isSuccess: false,
    });
  }
};

const updateUser = async (req, res) => {
  const { email, firstName, lastName, dob, address } = req.body;
  try {
    const id = req.params.id;
    const userdata = { email, firstName: firstName.trim(), lastName: lastName.trim(), dob: dob.trim(), address: address.trim() };

    const user = await User.findByIdAndUpdate(id, { $set: userdata }, { new: true }).exec();
    await Post.updateMany({ 'author._id': id }, { $set: { 'author.userdata': userdata } });

    res.status(200).json({
      message: "Update user by id successful",
      data: user,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      message: 'Failed to update user',
      data: null,
      isSuccess: false,
    });
  }
};

const acceptFriendRequest = async (req, res) => {
  const userId = req.params.id;
  const { friendRequest, acceptRequest } = req.body;

  try {
    const user1 = await User.findById(userId).exec();
    const user2 = await User.findById(friendRequest._id).exec();

    if (!user1 || !user2) {
      return res.status(404).json({ message: 'User not found', isSuccess: 0 });
    }

    if (acceptRequest) {
      user1.friend.push(user2._id);
      user2.friend.push(user1._id);

      user1.friendRequests = user1.friendRequests.filter(req => req.toString() !== user2._id.toString());
      user2.friendRequests = user2.friendRequests.filter(req => req.toString() !== user1._id.toString());
    } else {
      user1.friendRequests = user1.friendRequests.filter(req => req.toString() !== user2._id.toString());
      user2.friendRequests = user2.friendRequests.filter(req => req.toString() !== user1._id.toString());
    }

    await user1.save();
    await user2.save();

    res.json({ message: 'Friend request processed successfully', isSuccess: 1, data: user1 });
  } catch (error) {
    console.error('Error processing friend request:', error);
    res.status(500).json({ message: 'Failed to process friend request', isSuccess: 0 });
  }
};

const sendFriendRequest = async (req, res) => {
  const userId = req.params.id;
  const { friend } = req.body;

  try {
    const user = await User.findById(userId).exec();
    const friendUser = await User.findById(friend._id).exec();

    if (!user || !friendUser) {
      return res.status(404).json({ message: 'User not found', isSuccess: 0 });
    }

    if (friendUser.friendRequests.includes(user._id)) {
      return res.status(400).json({ message: 'Friend request already sent', isSuccess: 0 });
    }

    friendUser.friendRequests.push(user._id);
    await friendUser.save();

    res.json({ message: 'Friend request sent successfully', isSuccess: 1 });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Failed to send friend request', isSuccess: 0 });
  }
};

const removeFriend = async (req, res) => {
  const userId = req.params.id;
  const { friendId } = req.body;

  try {
    const user = await User.findById(userId).exec();
    const friendToRemove = await User.findById(friendId).exec();

    if (!user || !friendToRemove) {
      return res.status(404).json({ message: 'User not found', isSuccess: 0 });
    }

    user.friend = user.friend.filter(friend => friend.toString() !== friendId.toString());
    friendToRemove.friend = friendToRemove.friend.filter(friend => friend.toString() !== userId.toString());

    await user.save();
    await friendToRemove.save();

    res.json({ message: 'Friend removed successfully', isSuccess: 1, data: user });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Failed to remove friend', isSuccess: 0 });
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = req.query.searchTerm;
    const searchResults = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } }
      ],
    }).exec();

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

const updatePictures = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn ảnh' });
    }

    const imageBuffer = req.file.buffer.toString('base64');

    const result = await cloudinary.uploader.upload(`data:image/png;base64,${imageBuffer}`, {
      folder: 'profile-pictures',
      public_id: `${req.params.id}_${Date.now()}`
    });

    const profilePictureUrl = result.secure_url;

    await User.findByIdAndUpdate(req.params.id, { profilePictureUrl });
    await Post.updateMany({ 'author._id': req.params.id }, { 'author.userdata.profilePictureUrl': profilePictureUrl });
    await Comment.updateMany({ 'author._id': req.params.id }, { 'author.profilePictureUrl': profilePictureUrl });

    res.json({ message: 'Successfully', profilePictureUrl });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error' });
  }
};

const updateCoverPicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn ảnh' });
    }

    const imageBuffer = req.file.buffer.toString('base64');

    const result = await cloudinary.uploader.upload(`data:image/png;base64,${imageBuffer}`, {
      folder: 'cover-pictures',
      public_id: `${req.params.id}_${Date.now()}`
    });

    const coverPictureUrl = result.secure_url;

    await User.findByIdAndUpdate(req.params.id, { coverPictureUrl });

    res.json({ message: 'Successfully', coverPictureUrl });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  acceptFriendRequest,
  sendFriendRequest,
  searchUsers,
  removeFriend,
  updatePictures,
  updateCoverPicture,
};
