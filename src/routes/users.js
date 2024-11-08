const express = require('express');
const userController = require('../controllers/usersController');
const verifyAuth = require('../middlewares/verifyAuth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const usersRouter = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({});


usersRouter.get("/", userController.getUsers);

usersRouter.get("/search", userController.searchUsers);

usersRouter.get("/:id", userController.getUserById);

usersRouter.put("/:id",verifyAuth, upload.single('image'), userController.updateUser);

usersRouter.post('/update-picture/:id', verifyAuth, upload.single('profilePicture'), userController.updatePictures);

usersRouter.post('/update-cover-picture/:id', verifyAuth, upload.single('coverPicture'), userController.updateCoverPicture);


module.exports = usersRouter;