// controllers/companyController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Company = require("../models/Company"); // Import the Company model
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendVerificationEmail = async(user, token) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Email Verification',
        html: `<p>Xin chào ${user.companyname},</p>
             <p>Để xác minh email của bạn, hãy nhấp vào liên kết sau:</p>
             <a href="http://localhost:3000/auth/verifyemail/company?token=${token}">Xác minh email của tôi</a>`,
    };

    await transporter.sendMail(mailOptions);
};

const companyRegister = async(req, res) => {
    try {
        const company = req.body;

        // Check if companyname already exists
        const existingCompany = await Company.findOne({ email: company.email });
        if (existingCompany) {
            return res.status(409).json({ message: "Companyname already exists", isSuccess: 0 });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(company.password, salt);
        const newCompany = new Company({
            ...company,
            password: hashedPassword,
        });

        const verificationToken = jwt.sign({ userId: newCompany._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        // Lưu người dùng vào database
        await newCompany.save();

        // Gửi email xác minh
        await sendVerificationEmail(newCompany, verificationToken);

        res.status(201).json({
            message: "Register Successfully! Please verify your email.",
            data: newCompany,
            isSuccess: 1,
        });

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Failed to register', isSuccess: 0 });
    }
};

const companyLogin = async(req, res) => {
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

const companyChangePassword = async(req, res) => {
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

const verifyEmail = async(req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const id = decoded.userId;

        // Cập nhật trạng thái xác minh của người dùng
        const user = await Company.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Company not found', isSuccess: 0 });
        }

        user.isVerified = true;

        await user.save();

        res.json({ message: 'Email Công ty của bạn đã được xác thực thành công!', isSuccess: 1 });
    } catch (err) {
        console.error('Error during email verification:', err);
        res.status(400).json({ message: 'Invalid or expired token', isSuccess: 0 });
    }
};


module.exports = { companyLogin, companyRegister, companyChangePassword, verifyEmail };