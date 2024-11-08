const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const nodemailer = require('nodemailer');
require('dotenv').config();

// Import User Model từ Mongoose
const User = require("../models/User");

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
        html: `<p>Xin chào ${user.username},</p>
               <p>Để xác minh email của bạn, hãy nhấp vào liên kết sau:</p>
               <a href="http://localhost:3000/auth/verifyemail/user?token=${token}">Xác minh email của tôi</a>`,
    };

    await transporter.sendMail(mailOptions);
};

const register = async(req, res) => {
    try {
        const { username, email, password, confirmpassword, firstName, lastName, country } = req.body;

        // Kiểm tra xem username hoặc email đã tồn tại chưa
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: "Username or Email already exists", isSuccess: 0 });
        }

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo người dùng mới
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            country,
            address: "",
            dob: "",
            profilePictureUrl: "",
            isVerified: false, // Đặt là chưa xác minh
        });

        // Tạo token xác minh
        const verificationToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        // Lưu người dùng vào database
        await newUser.save();

        // Gửi email xác minh
        await sendVerificationEmail(newUser, verificationToken);

        res.status(201).json({
            message: "Register Successfully! Please verify your email.",
            data: newUser,
            isSuccess: 1,
        });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ error: 'Failed to register' });
    }
};

const login = async(req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm người dùng theo username
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Kiểm tra xem người dùng đã xác minh email chưa
        if (!user.isVerified) {
            return res.status(401).json({ message: "Email not verified. Please check your email." });
        }

        // Kiểm tra mật khẩu
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Tạo JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

        res.json({
            message: 'Login successful',
            token,
            user,
            isSuccess: 1,
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Failed to log in' });
    }
};


const loginWithGoogle = async(req, res) => {
    const idToken = req.body.id;

    try {
        // Xác thực token với Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: profilePictureUrl, email_verified: isVerified } = payload;

        // Kiểm tra xem người dùng đã tồn tại chưa dựa trên googleId
        let user = await User.findOne({ username: googleId });

        if (!user) {
            // Tạo mật khẩu ngẫu nhiên và hash nó
            const randomPassword = Math.random().toString(36).slice(-8); // Tạo mật khẩu ngẫu nhiên
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            // Nếu người dùng chưa tồn tại, tạo người dùng mới
            user = new User({
                username: googleId, // Bạn có thể sử dụng email làm username nếu muốn
                email,
                password: hashedPassword, // Lưu trữ mật khẩu đã được hash
                firstName,
                lastName,
                friend: [],
                friendRequests: [],
                address: "",
                dob: "",
                profilePictureUrl,
                coverPictureUrl: "",
                isVerified,
            });

            await user.save();
        }

        // Tạo JWT token cho người dùng
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

        res.json({
            message: 'Login with Google successful',
            token,
            user,
            isSuccess: 1,
        });
    } catch (err) {
        console.error('Error during Google login:', err);
        res.status(500).json({ error: 'Failed to log in with Google', isSuccess: 0 });
    }
};

const changePassword = async(req, res) => {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    try {
        // Tìm người dùng theo ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found', isSuccess: 0 });
        }

        // Kiểm tra mật khẩu hiện tại
        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Current password is incorrect', isSuccess: 0 });
        }

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật mật khẩu mới
        user.password = hashedNewPassword;
        await user.save();

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
        const userId = decoded.userId;

        // Cập nhật trạng thái xác minh của người dùng
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found', isSuccess: 0 });
        }

        user.isVerified = true;
        await user.save();

        res.json({ message: 'Email người dùng đã được xác thực thành công!', isSuccess: 1 });
    } catch (err) {
        console.log('Error during email verification:', err);
        res.status(400).json({ message: 'Invalid or expired token', isSuccess: 0 });
    }
};

module.exports = { login, register, changePassword, loginWithGoogle, verifyEmail };