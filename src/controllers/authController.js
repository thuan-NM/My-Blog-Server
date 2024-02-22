const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
require('dotenv').config();

const { db } = require("../utils/connectDb");

const register = async (req, res) => {
    const { username, email, password, confirmpassword,firstName,lastName,country } = req.body;
    const existingUser = await db.users.findOne({
        username: username
    });
    if (existingUser) {
        return res.status(409).json({ message: "Username already exists" , isSuccess: 0,});
      }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
        username: username,
        email: email,
        password: hashedPassword,
        friend: [],
        friendRequests: [],
        firstName: firstName,
        lastName: lastName,
        country: country,
        address: "",
        dob: "",
        profilePictureUrl:"",
    };
    await db.users.insertOne(newUser);
    res.status(201).json({
        message: "Register Successfully !",
        data: newUser,
        isSuccess: 1,
    });
}

const login = async(req, res) => {
    try {
    // Create checkAcount function to check students account with name and age
        const { username, password } = req.body;
        const user = await db.users.findOne({ username: username, });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
    
        const isPasswordMatch = await bcrypt.compare(password, user.password);
    
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.json({
            message: 'Login successful',
            token,
            user: user,
            isSuccess: 1,
        });
        } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Failed to log in' });
        }
};
const changePassword = async (req, res) => {
    const userId = req.params.id;
    console.log(userId)
    const { currentPassword, newPassword } = req.body;
  
    try {
      const user = await db.users.findOne({ _id: new ObjectId(userId) });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found', isSuccess: 0 });
      }
  
      const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
  
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Current password is incorrect', isSuccess: 0 });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);
  
      await db.users.updateOne({ _id: new ObjectId(userId) }, { $set: { password: hashedNewPassword } });
  
      res.json({ message: 'Password changed successfully', isSuccess: 1 });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Failed to change password', isSuccess: 0 });
    }
  };

module.exports = { login, register,changePassword };