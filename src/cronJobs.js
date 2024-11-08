// cronJobs.js
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const moment = require('moment');
const JobStatus = require('./models/JobStatus');
const User = require('./models/User');
const Company = require('./models/Company');

// Thiết lập cron job
cron.schedule('0 0 * * *', async() => {
    try {
        const today = moment().startOf('day');
        const interviewsToday = await JobStatus.find({
            interviewDate: {
                $gte: today.toDate(),
                $lt: today.clone().add(1, 'day').toDate()
            },
            status: 'Interview Confirmed'
        });

        interviewsToday.forEach(async(interview) => {
            const candidate = await User.findById(interview.userid);
            const company = await Company.findById(interview.companyid);

            const videoCallUrl = `http://localhost:5173/call/${candidate._id}/${company._id}`;

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: `"Company" <${process.env.EMAIL_USER}>`,
                to: candidate.email,
                subject: 'Interview Reminder',
                html: `
                    <div style="background-color: #f9f9f9; padding: 20px; font-family: Arial, sans-serif;">
                        <h2 style="color: #333333;">Interview Reminder</h2>
                        <p>Dear ${candidate.firstName},</p>
                        <p>This is a reminder for your interview scheduled today.</p>
                        <p><strong>Date and Time:</strong> ${new Date(interview.interviewDate).toLocaleString()}</p>
                        <p>Click the link below to join the video call at the scheduled time:</p>
                        <a href="${videoCallUrl}" style="background-color: #28a745; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px;">Join Video Call</a>
                    </div>
                `,
            };

            await transporter.sendMail(mailOptions);
        });
    } catch (error) {
        console.error('Error sending reminder emails:', error);
    }
});