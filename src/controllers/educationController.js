const { ObjectId } = require("mongodb");
const { db } = require("../utils/connectDb");

const createEduByUserId = async (req, res) => {
    try {
        const userId = req.body.user._id;
        const school = req.body.school
        const degree = req.body.degree;
        const from = req.body.from;
        const to = req.body.to;
        const description = req.body.description;

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

        const edu = {
            school:school,
            degree: degree,
            from:from,
            to:to,
            description: description,
            author: {
                _id: new ObjectId(userId),
                userdata: user.user_info,
                // Add other user information as needed
            },
        }
        await db.educations.insertOne(edu);


        res.status(201).json({
            message: "Add education successfully!",
            data: edu,
            isSuccess: true,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Failed to create education',
            data: [],
            isSuccess: false,
        });
    }

}

const getEdus = async (req, res) => {
    try {
        const userid = req.params.id;
        const educations = await db.educations.find({ "author._id": new ObjectId(userid), }).toArray();
        if (educations != null) {
            res.status(200).json({
                message: "Get educations list successfully",
                data: educations,
                isSuccess: true,
            });
        }
        else {
            res.status(200).json({
                message: "Get educations list successfully",
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

const deleteEdu = async (req, res) => {
    try {
        const eduid = req.params.id;
        await db.educations.deleteOne({ "_id": new ObjectId(eduid), });
            res.status(200).json({
                message: "Delete educations successfully",
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

const updateEdu = async (req, res) => {
    try {
        const eduid = req.params.id;
        const school = req.body.school;
        const degree = req.body.degree;
        const from = req.body.from;
        const to = req.body.to;
        const userId = req.body.user._id;
        const description = req.body.description;

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

        console.log(from)
        console.log(to)

        const education = await db.educations.findOne({ "_id": new ObjectId(eduid), })

        let schooldata,degreedata,descriptiondata = "";
        let fromdata = new Date();
        let todata = new Date();
        if (school=="") {schooldata=education.school}
        else{schooldata =school;}

        if(description=="") {descriptiondata=education.description}
        else {descriptiondata=description}

        if(from == null) {fromdata=education.from}
        else {fromdata=from}

        if(to == null ) {todata=education.to}
        else {todata=to}

        if(degree=="") {degreedata=education.degree}
        else {degreedata=degree}

        const [user] = await db.users.aggregate(pipeline).toArray();

        if (education != null) {
            await db.educations.updateOne({
                _id: new ObjectId(eduid),
            },
                {
                    $set: {
                        school: schooldata,
                        degree: degreedata,
                        from:fromdata,
                        to:todata,
                        description: descriptiondata,
                        author: {
                            _id: new ObjectId(userId),
                            userdata: user.user_info,
                            // Add other user information as needed
                        },
                    },
                })
            res.status(200).json({
                message: "Edit education successfully",
                data: education,
                isSuccess: true,
            });
        }
        else {
            res.status(200).json({
                message: "Education not found",
                data: "",
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

module.exports = { createEduByUserId, getEdus, deleteEdu, updateEdu }