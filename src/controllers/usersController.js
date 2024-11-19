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
  const { username, email, firstName, lastName, dob, address, country } = req.body;
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        data: null,
        isSuccess: false,
      });
    }

    const userdata = {
      username: username.trim(),
      email: email?.trim(),  // Nếu không gửi email từ front-end, giữ nguyên email cũ
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob: dob ? new Date(dob) : null, // Chuyển chuỗi dob sang Date object
      address: address.trim(),
      country: country.trim(),
    };

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


const searchUsers = async (req, res) => {
  try {
    const query = req.query.searchTerm;
    const searchResults = await User.find({
      $or: [
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
  searchUsers,
  updatePictures,
  updateCoverPicture,
};
