const mongoose = require('mongoose');
const Reaction = require('../models/Reaction');

const getReactionStats = async(req, res) => {
    try {
        const postId = req.params.id;

        // Calculate total reactions for the post
        const totalReactions = await Reaction.countDocuments({ postId: new mongoose.Types.ObjectId(postId) });

        // Retrieve all reactions for the post
        const reactions = await Reaction.find({ postId: new mongoose.Types.ObjectId(postId) }).exec();

        res.status(200).json({
            message: "Get reaction stats successful",
            data: { totalReactions, reactions },
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error getting reaction stats:', error);
        res.status(500).json({
            message: 'Failed to get reaction stats',
            data: null,
            isSuccess: false,
        });
    }
};

const handleReaction = async(req, res) => {
    try {
        const postId = req.params.id;
        const { userId } = req.body;

        // Check if the user has already reacted
        const existingReaction = await Reaction.findOne({
            postId: new mongoose.Types.ObjectId(postId),
            userId: new mongoose.Types.ObjectId(userId),
        }).exec();

        if (existingReaction) {
            // If the user has already reacted, remove the reaction
            await Reaction.deleteOne({ _id: existingReaction._id });
        } else {
            // If the user hasn't reacted, create a new reaction
            await Reaction.create({
                postId: new mongoose.Types.ObjectId(postId),
                userId: new mongoose.Types.ObjectId(userId),
            });
        }

        // Calculate total reactions for the post
        const totalReactions = await Reaction.countDocuments({
            postId: new mongoose.Types.ObjectId(postId),
        });

        res.status(200).json({
            message: "Reaction updated successfully",
            data: {
                postId,
                totalReactions,
                existingReaction, // Include user's reaction information in the response
            },
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error handling reaction:', error);
        res.status(500).json({
            message: 'Failed to handle reaction',
            data: null,
            isSuccess: false,
        });
    }
};

module.exports = {
    handleReaction,
    getReactionStats,
};