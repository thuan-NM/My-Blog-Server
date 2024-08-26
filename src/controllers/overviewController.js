const Overview  = require("../models/Overview");
const User = require('../models/User'); // Assuming you have a User model

// CREATE or UPDATE overview by User ID
const createOverviewByUserId = async (req, res) => {
    try {
        const { _id: userId } = req.body.user;
        const data = req.body.overviewdata;

        const user = await User.findById(userId).select("-password -friend -friendRequests -username");
        if (!user) {
            return res.status(404).json({ message: "User not found", isSuccess: false });
        }

        let overview = await Overview.findOne({ "author._id": userId });

        if (overview) {
            overview.data = data;
            overview.author = {
                _id: userId,
                userdata: user,
            };
            await overview.save();
        } else {
            overview = new Overview({
                data,
                author: {
                    _id: userId,
                    userdata: user,
                },
            });
            await overview.save();
        }

        res.status(201).json({
            message: "Edit overview successfully!",
            data: overview,
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error creating or updating overview:', error);
        res.status(500).json({
            message: 'Failed to create or update overview',
            data: null,
            isSuccess: false,
        });
    }
}

// GET overview by User ID
const getOverviews = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const overview = await Overview.findOne({ "author._id": userId });

        res.status(200).json({
            message: "Get overview successfully",
            data: overview || "",
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

module.exports = { createOverviewByUserId, getOverviews };
