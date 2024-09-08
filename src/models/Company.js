// models/Company.js
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    companyname: { type: String, required: true},
    password: { type: String, required: true },
    profilePictureUrl: { type: String, default: "" },
    coverPictureUrl: { type: String, default: "" },
    field: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    numberOfEmployees: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    socialMediaLinks: {
        linkedIn: { type: String, default: "" },
        twitter: { type: String, default: "" },
        facebook: { type: String, default: "" },
        websiteUrl: { type: String, default: "" },
    },
    location: {
        country: { type: String, required: true },
        address: { type: String, default: "" },
        coordinates: [Number]
    }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
