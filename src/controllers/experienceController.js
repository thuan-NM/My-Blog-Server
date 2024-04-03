const { ObjectId } = require("mongodb");
const { db } = require("../utils/connectDb");

const createExpByUserId = async (req, res) => {
    try {
        const userId = req.body.user._id;
        const subject = req.body.subject;
        const description = req.body.description

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

        const exp = {
            subject: subject,
            description: description,
            author: {
                _id: new ObjectId(userId),
                userdata: user.user_info,
                // Add other user information as needed
            },
        }

        const exist = await db.experiences.findOne({ "author._id": new ObjectId(userId) },)
        await db.experiences.insertOne(exp);


        res.status(201).json({
            message: "Add experience successfully!",
            data: exp,
            isSuccess: true,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Failed to create experience',
            data: [],
            isSuccess: false,
        });
    }

}

const getExps = async (req, res) => {
    try {
        const userid = req.params.id;
        const experiences = await db.experiences.find({ "author._id": new ObjectId(userid), }).toArray();
        if (experiences != null) {
            res.status(200).json({
                message: "Get experiences list successfully",
                data: experiences,
                isSuccess: true,
            });
        }
        else {
            res.status(200).json({
                message: "Get experiences list successfully",
                data: [],
                isSuccess: true,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: [],
            isSuccess: false,
        });
    }
};

const deleteExp = async (req, res) => {
    try {
        const expid = req.params.id;
        await db.experiences.deleteOne({ "_id": new ObjectId(expid), })
            res.status(200).json({
                message: "Delete experience successfully",
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

const updateExp = async (req, res) => {
    try {
        const expid = req.params.id;
        const subjectdata = req.body.subject;
        const userId = req.body.user._id;
        const descriptiondata = req.body.description;

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

        const experience = await db.experiences.findOne({"_id": new ObjectId(expid)},)
        let subject,description = "";
        if (subjectdata=="") {
            subject=experience.subject
        }
        else{
            subject =subjectdata;
        }
        if(descriptiondata=="") {description=experience.description}
        else {description=descriptiondata}

        const [user] = await db.users.aggregate(pipeline).toArray();

        await db.experiences.updateOne({
            _id: new ObjectId(expid),
        },
            {
                $set: {
                    subject: subject,
                    description: description,
                    author: {
                        _id: new ObjectId(userId),
                        userdata: user.user_info,
                        // Add other user information as needed
                    },
                },
            })
        res.status(200).json({
            message: "Update experience successfully",
            data: experience,
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

module.exports = { createExpByUserId, getExps, deleteExp, updateExp }