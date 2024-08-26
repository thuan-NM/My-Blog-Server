const Education = require("../models/Education");
const User = require('../models/User'); // Assuming you have a User model

// CREATE education by User ID
const createEduByUserId = async (req, res) => {
    try {
        const { _id: userId } = req.body.user;
        const { school, degree, from, to, description } = req.body;

        const user = await User.findById(userId).select("-password -friend -friendRequests -username");
        if (!user) {
            return res.status(404).json({ message: "User not found", isSuccess: false });
        }

        const edu = new Education({
            school,
            degree,
            from,
            to,
            description,
            author: {
                _id: userId,
                userdata: user,
            },
        });

        await edu.save();

        res.status(201).json({
            message: "Add education successfully!",
            data: edu,
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to create education',
            data: [],
            isSuccess: false,
        });
    }
};

// GET educations by User ID
const getEdus = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const educations = await Education.find({ "author._id": userId });

        res.status(200).json({
            message: "Get educations list successfully",
            data: educations,
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: [],
            isSuccess: false,
        });
    }
};

// DELETE education by ID
const deleteEdu = async (req, res) => {
    try {
        const { id: eduId } = req.params;
        await Education.findByIdAndDelete(eduId);

        res.status(200).json({
            message: "Delete education successfully",
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: [],
            isSuccess: false,
        });
    }
};

// UPDATE education by ID
const updateEdu = async (req, res) => {
    try {
        const { id: eduId } = req.params;
        const { school, degree, from, to, description, user } = req.body;
        const test = new Date(from)
        console.log(test.toISOString().split('T')[0])
        const updatedData = {
            school: school || undefined,
            degree: degree || undefined,
            from: from || undefined,
            to: to || undefined,
            description: description || undefined,
            author: {
                _id: user._id,
                userdata: await User.findById(user._id).select("-password -friend -friendRequests -username"),
            },
        };

        const education = await Education.findByIdAndUpdate(eduId, { $set: updatedData }, { new: true });

        if (!education) {
            return res.status(404).json({
                message: "Education not found",
                data: "",
                isSuccess: false,
            });
        }

        res.status(200).json({
            message: "Edit education successfully",
            data: education,
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: [],
            isSuccess: false,
        });
    }
};

module.exports = { createEduByUserId, getEdus, deleteEdu, updateEdu };
