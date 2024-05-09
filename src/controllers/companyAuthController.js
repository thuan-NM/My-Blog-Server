const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
require('dotenv').config();

const { db } = require("../utils/connectDb");

const companyRegister = async (req, res) => {
    const { email,companyname, password, confirmpassword,country } = req.body;
    const existingCompany = await db.companies.findOne({
        companyname: companyname
    });
    if (existingCompany) {
        return res.status(409).json({ message: "Companyname already exists" , isSuccess: 0,});
      }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newCompany = {
        email:email,
        companyname: companyname,
        password: hashedPassword,
        country: country,
        address: "",
        profilePictureUrl:"",
    };
    await db.companies.insertOne(newCompany);
    res.status(201).json({
        message: "Register Successfully !",
        data: newCompany,
        isSuccess: 1,
    });
}

const companyLogin = async(req, res) => {
    try {
    // Create checkAcount function to check students account with name and age
        const { email, password } = req.body;
        console.log(password)
        const company = await db.companies.findOne({ email: email, });
        if (!company) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
    
        const isPasswordMatch = await bcrypt.compare(password, company.password);
    
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ companyId: company._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.json({
            message: 'Login successful',
            token,
            company: company,
            isSuccess: 1,
        });
        } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Failed to log in' });
        }
};
const companyChangePassword = async (req, res) => {
    const companyId = req.params.id;
    console.log(companyId)
    const { currentPassword, newPassword } = req.body;
  
    try {
      const company = await db.companies.findOne({ _id: new ObjectId(companyId) });
  
      if (!company) {
        return res.status(404).json({ message: 'Company not found', isSuccess: 0 });
      }
  
      const isPasswordMatch = await bcrypt.compare(currentPassword, company.password);
  
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Current password is incorrect', isSuccess: 0 });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);
  
      await db.companies.updateOne({ _id: new ObjectId(companyId) }, { $set: { password: hashedNewPassword } });
  
      res.json({ message: 'Password changed successfully', isSuccess: 1 });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Failed to change password', isSuccess: 0 });
    }
  };

module.exports = { companyLogin, companyRegister,companyChangePassword };