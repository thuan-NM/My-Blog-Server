const mongoose = require("mongoose");
require('dotenv').config();

// Import các Model
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Reaction = require('../models/Reaction');
const Company = require('../models/Company');
const Overview = require('../models/Overview');
const KeySkill = require('../models/KeySkill');
// const Experience = require('./models/Experience');
// const Education = require('./models/Education');
// const Message = require('./models/Message');
const JobStatus = require('../models/JobStatus');
const Follow = require('../models/Follow');

const db = {
    Post,
    User,
    Comment,
    Reaction,
    Company,
    Overview,
    KeySkill,
    // Experience,
    // Education,
    // Message,
    JobStatus,
    Follow
};


async function connectDb() {
    try {
        console.log("Connect to database successfully!!");
        await mongoose.connect(process.env.MONGO_URI, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            autoIndex: true,
        });
    } catch (error) {
        console.error("Error connecting to the database", error);
    }
}

module.exports = { connectDb, db };