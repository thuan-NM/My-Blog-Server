const KeySkill = require("../models/KeySkill");
const Company = require('../models/Company');

// CREATE or UPDATE keyskills by Company ID
const createKeySkillsByCompanyId = async (req, res) => {
    try {
        const { _id: companyId } = req.body.user;
        const data = req.body.keyskilldata;

        // Tìm công ty theo ID và loại trừ mật khẩu trong kết quả trả về
        const company = await Company.findById(companyId).select("-password");
        if (!company) {
            return res.status(404).json({ message: "Company not found", isSuccess: false });
        }

        // Tìm kiếm KeySkills của công ty theo companyId
        let keyskill = await KeySkill.findOne({ author: companyId });

        if (keyskill) {
            // Cập nhật danh sách key skills nếu đã tồn tại
            keyskill.data = data;
            await keyskill.save();
        } else {
            // Tạo mới key skills cho công ty
            keyskill = new KeySkill({
                data,
                author: companyId,  // Gán author là companyId
            });
            await keyskill.save();
        }

        res.status(201).json({
            message: "Edit key skills successfully!",
            data: keyskill,
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to create or update key skills',
            data: null,
            isSuccess: false,
        });
    }
}

// GET keyskills by Company ID
const getKeySkillsByCompanyId = async (req, res) => {
    try {
        const { id: companyId } = req.params;

        // Tìm key skills của công ty theo companyId
        const keyskill = await KeySkill.findOne({ author: companyId });

        res.status(200).json({
            message: "Get key skills successfully",
            data: keyskill || "",
            isSuccess: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            data: null,
            isSuccess: false,
        });
    }
};

module.exports = { createKeySkillsByCompanyId, getKeySkillsByCompanyId };
