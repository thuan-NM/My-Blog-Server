// models/Company.js
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    companyname: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, default: "" },
    profilePictureUrl: { type: String, default: "" },
    coverPictureUrl: { type: String, default: "" },
    field: {type:String, default:""},
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
