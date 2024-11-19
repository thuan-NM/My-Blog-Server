// cronJobs.js
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const moment = require('moment');
const JobStatus = require('./models/JobStatus');
const User = require('./models/User');
const Room = require('./models/Room'); // Đảm bảo import Room model

// Thiết lập cron job
cron.schedule('*/45 * * * *', async () => { // Chạy mỗi 30 phút
    try {
        const now = moment(); // Thời gian hiện tại
        const twoHoursLater = moment().add(2, 'hours'); // Thời điểm sau 2 tiếng

        // Tìm các buổi phỏng vấn chưa gửi email nhắc nhở và diễn ra sau 2 tiếng
        const interviewsSoon = await JobStatus.find({
            interviewDate: {
                $gte: now.toDate(), // Sau thời gian hiện tại
                $lt: twoHoursLater.toDate() // Trước 2 tiếng nữa
            },
            status: 'Interview Confirmed',
            emailReminderSent: false // Chỉ lấy những buổi chưa gửi nhắc nhở
        });

        for (const interview of interviewsSoon) {
            const candidate = await User.findById(interview.userid);
            const room = await Room.findOne({ name: `${candidate._id}-${interview.companyid}` });
            const userkey = room ? room.userkey : 'Không tìm thấy phòng';
            const videoCallUrl = `http://localhost:5173/call/${candidate._id}/${interview.companyid}`;

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: `"Meow Blog" <${process.env.EMAIL_USER}>`,
                to: candidate.email,
                subject: `Nhắc Hẹn Buổi Phỏng Vấn Trong 2 Tiếng - ${candidate.firstName} ${candidate.lastName}`,
                html: `
                    <div style="background-color: #f9f9f9; padding: 20px; font-family: Arial, sans-serif;">
                        <table align="center" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                            <tr>
                                <td style="text-align: center; padding-bottom: 20px;">
                                    <img src="https://res.cloudinary.com/dca8kjdlq/image/upload/v1731754143/myfavicon_dokhmh.png" alt="Logo Công ty" style="width: 80px; border-radius: 50%; margin-bottom: 20px;"/>
                                    <h2 style="color: #333333; margin-bottom: 0;">Nhắc Nhở Buổi Phỏng Vấn</h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                                    <p>Xin chào ${candidate.firstName},</p>
                                    <p>Bạn có buổi phỏng vấn sắp diễn ra trong 2 tiếng. Thông tin chi tiết:</p>
                                    <p><strong>Ngày và Giờ:</strong> ${new Date(interview.interviewDate).toLocaleString()}</p>
                                    <p>Vui lòng nhấn vào liên kết dưới đây để tham gia cuộc gọi video vào thời gian đã sắp xếp:</p>
                                    <div style="display: block; margin-bottom: 10px;">
                                        <p style="margin-bottom: 10px;">Mật khẩu để tham gia phòng là: 
                                            <span style="font-weight: bold; font-size: 1rem; background-color: #f5f5f5; padding: 8px; border-radius: 4px;">
                                                ${userkey}
                                            </span>
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align: center; padding: 20px;">
                                    <a href="${videoCallUrl}" style="background-color: #28a745; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">Tham Gia Cuộc Gọi Video</a>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 20px; font-size: 14px; color: #888888; text-align: center; border-top: 1px solid #eeeeee;">
                                    <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email ${process.env.EMAIL_USER}.</p>
                                    <p>Trân trọng,<br><strong>Đội Ngũ Tuyển Dụng Công Ty</strong></p>
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align: center; font-size: 12px; color: #aaaaaa; padding-top: 20px;">
                                    <p>© ${new Date().getFullYear()} Công Ty. Mọi quyền được bảo lưu.</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                `
            };

            // Gửi email
            await transporter.sendMail(mailOptions);

            // Cập nhật trạng thái email đã gửi
            interview.emailReminderSent = true;
            await interview.save();
        }
    } catch (error) {
        console.error('Error sending reminder emails:', error);
    }
});
