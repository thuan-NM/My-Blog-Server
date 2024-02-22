const express = require('express');
const companiesController = require('../controllers/companiesController');
const verifyAuth = require('../middlewares/verifyAuth');

const companiesRouter = express.Router();

companiesRouter.get("/", companiesController.getCompanies);

companiesRouter.get("/search", companiesController.searchCompanies);

companiesRouter.get("/:id", companiesController.getCompanyById);

companiesRouter.put("/:id",verifyAuth, companiesController.updateCompany);

// companiesRouter.put('/:id/accept-friend-request', verifyAuth, userController.acceptFriendRequest);

// companiesRouter.put('/:id/send-friend-request', verifyAuth, userController.sendFriendRequest);

// companiesRouter.put('/:id/remove-friend', verifyAuth, userController.removeFriend);

// companiesRouter.post('/update-picture/:id', verifyAuth, upload.single('profilePicture'), userController.updatePictures);

module.exports = companiesRouter;