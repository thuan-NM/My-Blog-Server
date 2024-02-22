const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyAuth = (req, res, next, requireAuth = true) => {
  try {
    // Kiểm tra xem header Authorization có tồn tại không
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) {
      throw new Error("Authorization header is missing");
    }

    // Lấy token từ header
    const token = tokenHeader.split(" ")[1];
    
    // Kiểm tra xem token có giá trị không
    if (!token) {
      throw new Error("Token is missing");
    }

    // Giải mã token và kiểm tra xác thực
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Nếu xác thực thành công, thêm thông tin người dùng vào req và chuyển sang middleware tiếp theo
    if (decoded) {
      req.user = decoded;
      next();
    } else {
      throw new Error("Invalid token");
    }
  } catch (err) {
    if (requireAuth) {
      res.status(401).json({ message: "Unauthorized: Invalid token for this operation" });
    } else {
      res.status(401).json({ message: "Unauthorized: You need to be logged in" });
    }
  }
};

module.exports = verifyAuth;
