const Experience = require('../models/Experience');
const User = require('../models/User'); // Assuming you have a User model

// Create a new experience
const createExpByUserId = async (req, res) => {
  try {
    const { subject, description, user } = req.body;

    // Fetch user information excluding certain fields
    const userData = await User.findById(user._id).select('-password -friend -friendRequests -username');

    if (!userData) {
      return res.status(404).json({ message: 'User not found', isSuccess: false });
    }

    const exp = new Experience({
      subject,
      description,
      author: {
        _id: user._id,
        userdata: userData,
      },
    });

    await exp.save();

    res.status(201).json({
      message: "Add experience successfully!",
      data: exp,
      isSuccess: true,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create experience',
      data: null,
      isSuccess: false,
    });
  }
};

// Get experiences by user ID
const getExps = async (req, res) => {
  try {
    const userId = req.params.id;
    const experiences = await Experience.find({ 'author._id': userId });

    res.status(200).json({
      message: "Get experiences list successfully",
      data: experiences,
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

// Delete an experience
const deleteExp = async (req, res) => {
  try {
    const expId = req.params.id;
    await Experience.findByIdAndDelete(expId);

    res.status(200).json({
      message: "Delete experience successfully",
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

// Update an experience
const updateExp = async (req, res) => {
  try {
    const expId = req.params.id;
    const { subject, description, user } = req.body;

    const userData = await User.findById(user._id).select('-password -friend -friendRequests -username');
    if (!userData) {
      return res.status(404).json({ message: 'User not found', isSuccess: false });
    }

    const updatedExp = await Experience.findByIdAndUpdate(
      expId,
      {
        subject: subject || undefined,
        description: description || undefined,
        author: {
          _id: user._id,
          userdata: userData,
        },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Update experience successfully",
      data: updatedExp,
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

module.exports = { createExpByUserId, getExps, deleteExp, updateExp };
