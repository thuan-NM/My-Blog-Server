// Add these imports to your existing backend file
const { ObjectId } = require("mongodb");
const { db } = require("../utils/connectDb");

// Controller to get reaction stats for a post
const getReactionStats = async (req, res) => {
  try {
    const postId = req.params.id;

    // Calculate total reactions for the post
    const totalReactions = await db.reactions.countDocuments({
      postId: new ObjectId(postId),
    });

    // Calculate counts for each reaction type
    const reactionCounts = {};
    const reactionTypes = ['like', 'heart', 'sad', 'angry']; // Add more types if needed

    for (const reactionType of reactionTypes) {
      const count = await db.reactions.countDocuments({
        postId: new ObjectId(postId),
        reactionType,
      });
      reactionCounts[reactionType] = count;
    }

    res.status(200).json({
      message: "Get reaction stats successful",
      data: { totalReactions, reactionCounts },
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
const handleReaction = async (req, res) => {
    try {
      
      const postId = req.params.id
      const { userId, reactionType } = req.body;
      console.log(postId , userId, reactionType);
  
      // Check if the user has already reacted
      const existingReaction = await db.reactions.findOne({
        postId: new ObjectId(postId),
        userId: new ObjectId(userId),
      });
      if(reactionType === "X"){
        await db.reactions.deleteOne(
          { _id: existingReaction._id },
        );
      }
      if (existingReaction) {
        // If the user has already reacted, update the reaction type
        await db.reactions.updateOne(
          { _id: existingReaction._id },
          { $set: { reactionType } }
        );
      } else {
        // If the user hasn't reacted, create a new reaction
        await db.reactions.insertOne({
          postId: new ObjectId(postId),
          userId: new ObjectId(userId),
          reactionType,
        });
      }
  
      // Calculate total reactions for the post
      const totalReactions = await db.reactions.countDocuments({
        postId: new ObjectId(postId),
      });
  
      res.status(200).json({
        message: "Reaction updated successfully",
        data: {
          postId,
          totalReactions,
          reactionType,
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
