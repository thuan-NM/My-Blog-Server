const mongoose = require("mongoose");

// Import các Model
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Reaction = require('../models/Reaction');
const Company = require('../models/Company');
const Overview = require('../models/Overview');
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
  // Experience,
  // Education,
  // Message,
  JobStatus,
  Follow
};

const MONGODB_URL = "mongodb+srv://nguyenminhthuan2003st:112233zZ%40@cluster0.iblshhh.mongodb.net/my-blog";

async function connectDb() {
  try {
    console.log("Connect to database successfully!!");
    await mongoose.connect(MONGODB_URL, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
}

module.exports = { connectDb, db };
