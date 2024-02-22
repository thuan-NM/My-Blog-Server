const validateRegisterInput = (req, res, next) => {
    const { username, email, password, confirmpassword } = req.body;

    if (!username || !email || !password || !confirmpassword) {
        return res.status(400).json({
            message: "All fields are required",
            isSuccess: 0,
        });
    }
    
    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Invalid email format",
            isSuccess: 0,
        });
    }

    // Kiểm tra mật khẩu có đủ mạnh không
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*()_+]/.test(password)) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
            isSuccess: 0,
        });
    }


    // Kiểm tra sự trùng khớp giữa password và confirmpassword
    if (password !== confirmpassword) {
        return res.status(400).json({
            message: "Passwords do not match",
            isSuccess: 0,
        });
    }

    next(); // Chuyển điều khiển đến middleware tiếp theo nếu mọi thứ hợp lệ
};

module.exports = validateRegisterInput ;
