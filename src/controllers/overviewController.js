const { ObjectId } = require("mongodb");
const { db } = require("../utils/connectDb");

const createOverviewByUserId = async (req, res) => {
    try {
        const userId = req.body.user._id;
        const data = req.body.overviewdata;

        const pipeline = [
            {
                $match: {
                    _id: new ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: 'users', // The name of the collection to perform the lookup
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user_info',
                },
            },
            {
                $unwind: '$user_info',
            },
            {
                $project: {
                    'user_info.password': 0,
                    'user_info.friend': 0,
                    'user_info.friendRequests': 0,
                    'user_info.username': 0,// Exclude sensitive information if needed
                },
            },
        ];

        const [user] = await db.users.aggregate(pipeline).toArray();

        const overview = {
            data,
            author: {
                _id: new ObjectId(userId),
                userdata: user.user_info,
                // Add other user information as needed
            },
        }
        
        const exist = await db.overviews.findOne({"author._id": new ObjectId(userId)},)
        if(exist!=null)
        {
            await db.overviews.updateOne({
                _id: new ObjectId(exist._id),
              },
              {
                $set: {
                    data : data,
                    author: {
                        _id: new ObjectId(userId),
                        userdata: user.user_info,
                        // Add other user information as needed
                    },
                },
              })
        }
        else
        {
            await db.overviews.insertOne(overview);
        }

        res.status(201).json({
            message: "Edit overview successfully!",
            data: overview,
            isSuccess: true,
        });
    }
    catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            message: 'Failed to create overview',
            data: null,
            isSuccess: false,
        });
    }

}

const getOverviews = async (req, res) => {
    try {
        const userid = req.params.id;
        const overviews = await db.overviews.findOne({"author._id" : new ObjectId(userid),})
        if(overviews!=null){
        res.status(200).json({
            message: "Get overviews list successfully",
            data: overviews,
            isSuccess: true,
        });}
        else{
            res.status(200).json({
            message: "Get overviews list successfully",
            data: "",
            isSuccess: true,
        });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: null,
            isSuccess: false,
        });
    }
};

module.exports = {createOverviewByUserId , getOverviews}