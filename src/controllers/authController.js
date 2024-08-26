const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require('dotenv').config();

// Import User Model từ Mongoose
const User = require("../models/User");

const register = async (req, res) => {
    try {
        const { username, email, password, confirmpassword, firstName, lastName, country } = req.body;

        // Kiểm tra xem username đã tồn tại chưa
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: "Username already exists", isSuccess: 0 });
        }

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo người dùng mới
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            friend: [],
            friendRequests: [],
            firstName,
            lastName,
            country,
            address: "",
            dob: "",
            profilePictureUrl: "",
        });

        // Lưu người dùng vào database
        await newUser.save();

        res.status(201).json({
            message: "Register Successfully!",
            data: newUser,
            isSuccess: 1,
        });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ error: 'Failed to register' });
    }
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Tìm người dùng theo username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
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

const changePassword = async (req, res) => {
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

module.exports = { login, register, changePassword };
