const Overview  = require("../models/Overview");
const User = require('../models/User'); // Assuming you have a User model
const Company = require('../models/Company'); // Assuming you have a Company model

// CREATE or UPDATE overview by User ID
const createOverviewByUserId = async (req, res) => {
    try {
        const { _id: userId } = req.body.user;
        const data = req.body.overviewdata;

        const user = await User.findById(userId).select("-password -friend -friendRequests -username");
        if (!user) {
            return res.status(404).json({ message: "User not found", isSuccess: false });
        }

        let overview = await Overview.findOne({ author: userId });

        if (overview) {
            overview.data = data;
            await overview.save();
        } else {
            overview = new Overview({
                data,
                author: userId,  // Gán author là userId
            });
            await overview.save();
        }

        res.status(201).json({
            message: "Edit overview successfully!",
            data: overview,
            isSuccess: true,
        });
    } catch (error) {
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
        const overview = await Overview.findOne({ "author": userId });

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

// CREATE or UPDATE overview by Company ID
const createOverviewByCompanyId = async (req, res) => {
    try {
        const { _id: companyId } = req.body.user;
        const data = req.body.overviewdata;

        const company = await Company.findById(companyId).select("-password");
        if (!company) {
            return res.status(404).json({ message: "Company not found", isSuccess: false });
        }

        let overview = await Overview.findOne({ author: companyId });

        if (overview) {
            overview.data = data;
            await overview.save();
        } else {
            overview = new Overview({
                data,
                author: companyId,  // Gán author là companyId
            });
            await overview.save();
        }

        res.status(201).json({
            message: "Edit overview successfully!",
            data: overview,
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to create or update overview',
            data: null,
            isSuccess: false,
        });
    }
}

// GET overview by Company ID
const getCompanyOverviews = async (req, res) => {
    try {
        const { id: companyId } = req.params;
        // console.log(companyId);
        const overview = await Overview.findOne({ "author": companyId });
        // console.log(overview);

        res.status(200).json({
            message: "Get company overview successfully",
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

module.exports = { createOverviewByUserId, getOverviews, createOverviewByCompanyId, getCompanyOverviews };
