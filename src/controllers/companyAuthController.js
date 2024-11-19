// controllers/companyController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Company = require("../models/Company"); // Import the Company model
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendVerificationEmail = async (user, token) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    const mailOptions = {
        from: `"Meow Blog" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Xác Minh Email - ${user.companyname}`,
        html: `
            <div style="background-color: #f9f9f9; padding: 20px; font-family: Arial, sans-serif;">
                <table align="center" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="text-align: center; padding-bottom: 20px;">
                            <img src="https://res.cloudinary.com/dca8kjdlq/image/upload/v1731754143/myfavicon_dokhmh.png" alt="Logo Công ty" style="width: 80px; border-radius: 50%; margin-bottom: 20px;"/>
                            <h2 style="color: #2d3748; margin-bottom: 10px;">Xin chào ${user.companyname},</h2>
                            <p style="color: #666666; margin-top: 5px;">Chúc mừng bạn đã đăng ký thành công!</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                            <p>Để xác minh email của bạn và hoàn tất quy trình đăng ký, vui lòng nhấp vào liên kết dưới đây:</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; padding: 20px;">
                            <a href="http://localhost:3000/auth/verifyemail/company?token=${token}"
                               style="background-color: #4caf50; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-size: 18px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); display: inline-block;">
                               Xác minh email của tôi
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 20px; font-size: 14px; color: #888888; text-align: center; border-top: 1px solid #eeeeee;">
                            <p>Nếu bạn không tự yêu cầu xác minh này, vui lòng bỏ qua email này.</p>
                            <p>Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; font-size: 12px; color: #aaaaaa; padding-top: 20px;">
                            <p>© ${new Date().getFullYear()} Company. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

const companyRegister = async (req, res) => {
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

const companyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const company = await Company.findOne({ email });
        if (!company) {
            return res.status(401).json({ message: "Không tồn tại email", isSuccess: 0 });
        }
        if (!company.isVerified) {
            return res.status(401).json({ message: "Email chưa được xác thực, vui lòng kiểm tra mail của bạn để xác thực!" });
        }

        const isPasswordMatch = await bcrypt.compare(password, company.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Sai mật khẩu", isSuccess: 0 });
        }

        const token = jwt.sign({ companyId: company._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

        res.json({
            message: 'Đăng nhập thành công',
            token,
            company,
            isSuccess: 1,
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Đăng nhập thất bại', isSuccess: 0 });
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

const verifyEmail = async (req, res) => {
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