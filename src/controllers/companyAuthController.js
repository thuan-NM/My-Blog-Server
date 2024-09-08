// controllers/companyController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Company = require("../models/Company"); // Import the Company model
require('dotenv').config();

const companyRegister = async (req, res) => {
  try {
    const { email, companyname, password, confirmpassword, country } = req.body;

    // Check if companyname already exists
    const existingCompany = await Company.findOne({ companyname });
    if (existingCompany) {
      return res.status(409).json({ message: "Companyname already exists", isSuccess: 0 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new company document
    const newCompany = new Company({
      email,
      companyname,
      password: hashedPassword,
      country,
      address: "",
      profilePictureUrl: "",
      coverPictureUrl: "",
      field: "",
    });

    await newCompany.save();

    res.status(201).json({
      message: "Register Successfully!",
      data: newCompany,
      isSuccess: 1,
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Failed to register', isSuccess: 0 });
  }
};

const companyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(401).json({ message: "Invalid credentials", isSuccess: 0 });
    }

    const isPasswordMatch = await bcrypt.compare(password, company.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials", isSuccess: 0 });
    }

    const token = jwt.sign({ companyId: company._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.json({
      message: 'Login successful',
      token,
      company,
      isSuccess: 1,
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Failed to log in', isSuccess: 0 });
  }
};

const companyChangePassword = async (req, res) => {
  const companyId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found', isSuccess: 0 });
    }

    const isPasswordMatch = await bcrypt.compare(currentPassword, company.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Current password is incorrect', isSuccess: 0 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    company.password = hashedNewPassword;
    await company.save();

    res.json({ message: 'Password changed successfully', isSuccess: 1 });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password', isSuccess: 0 });
  }
};

module.exports = { companyLogin, companyRegister, companyChangePassword };
