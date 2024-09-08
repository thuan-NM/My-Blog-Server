const express = require('express');
const companiesController = require('../controllers/companiesController');
const verifyAuth = require('../middlewares/verifyAuth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const companiesRouter = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({});

companiesRouter.get("/", companiesController.getCompanies);

companiesRouter.get("/search", companiesController.searchCompanies);

companiesRouter.get("/:id", companiesController.getCompanyById);

companiesRouter.put("/:id",verifyAuth, companiesController.updateCompany);

// companiesRouter.put('/:id/accept-friend-request', verifyAuth, userController.acceptFriendRequest);

// companiesRouter.put('/:id/send-friend-request', verifyAuth, userController.sendFriendRequest);

// companiesRouter.put('/:id/remove-friend', verifyAuth, userController.removeFriend);

companiesRouter.post('/update-picture/:id', verifyAuth, upload.single('profilePicture'), companiesController.updatePictures);

companiesRouter.post('/update-cover-picture/:id', verifyAuth, upload.single('coverPicture'), companiesController.updateCoverPicture);


module.exports = companiesRouter;