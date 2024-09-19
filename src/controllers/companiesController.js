const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Company = require('../models/Company');
const Post = require('../models/Post');
const Comment = require("../models/Comment");

const getCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    const [companies, totalCount] = await Promise.all([
      Company.find(),
      Company.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      message: "Get companies list successful",
      data: companies,
      page,
      pageSize,
      totalPages,
      totalCount,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      message: 'Failed to fetch companies',
      data: null,
      isSuccess: false,
    });
  }
};

const getCompanyById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid company ID format',
        data: null,
        isSuccess: false,
      });
    }

    const company = await Company.findById(id).exec();
    if (!company) {
      return res.status(404).json({
        message: 'Company not found',
        data: null,
        isSuccess: false,
      });
    }

    return res.status(200).json({
      message: 'Get company detail by ID successful',
      data: company,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error fetching company by ID:', error);
    res.status(500).json({
      message: 'Failed to fetch company by ID',
      data: null,
      isSuccess: false,
    });
  }
};

const updateCompany = async (req, res) => {
  const { email, firstName, lastName, country, address } = req.body;
  try {
    const id = req.params.id;

    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      {
        email,
        companyname: firstName,
        country,
        address,
      },
      { new: true }
    );

    const companydata = {
      email,
      firstName,
      lastName,
      address,
    };

    await Post.updateMany(
      { 'author._id': id },
      { $set: { 'author.userdata': companydata } }
    );

    res.status(200).json({
      message: "Update company by id successful",
      data: updatedCompany,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      message: 'Failed to update company',
      data: null,
      isSuccess: false,
    });
  }
};

const searchCompanies = async (req, res) => {
  try {
    const query = req.query.searchTerm;
    const searchResults = await Company.find({
      $or: [
        { companyname: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    });

    res.status(200).json({
      message: "Search companies successful",
      data: searchResults,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error searching companies:', error);
    res.status(500).json({
      message: 'Failed to search companies',
      data: null,
      isSuccess: false,
    });
  }
};

const updateCoverPicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn ảnh' });
    }

    const imageBuffer = req.file.buffer.toString('base64');

    const result = await cloudinary.uploader.upload(`data:image/png;base64,${imageBuffer}`, {
      folder: 'cover-pictures',
      public_id: `${req.params.id}_${Date.now()}`
    });

    const coverPictureUrl = result.secure_url;

    await Company.findByIdAndUpdate(req.params.id, { coverPictureUrl });

    res.json({ message: 'Successfully', coverPictureUrl });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error' });
  }
};

const updatePictures = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn ảnh' });
    }

    const imageBuffer = req.file.buffer.toString('base64');

    const result = await cloudinary.uploader.upload(`data:image/png;base64,${imageBuffer}`, {
      folder: 'profile-pictures',
      public_id: `${req.params.id}_${Date.now()}`
    });

    const profilePictureUrl = result.secure_url;

    await Company.findByIdAndUpdate(req.params.id, { profilePictureUrl });
    await Post.updateMany({ 'author._id': req.params.id }, { 'author.userdata.profilePictureUrl': profilePictureUrl });
    await Comment.updateMany({ 'author._id': req.params.id }, { 'author.profilePictureUrl': profilePictureUrl });

    res.json({ message: 'Successfully', profilePictureUrl });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error' });
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  updateCompany,
  searchCompanies,
  updateCoverPicture,
  updatePictures,
};
