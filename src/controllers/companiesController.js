const { ObjectId } = require("mongodb");
const cloudinary = require('cloudinary').v2;
const { db } = require("../utils/connectDb");


const getCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const skip = (page - 1) * pageSize;

    const [companies, totalCount] = await Promise.all([
      db.companies.find().skip(skip).limit(pageSize).toArray(),
      db.companies.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      message: "Get companies list successful",
      data: companies,
      page,
      pageSize,
      totalPages,
      totalCount,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      message: 'Failed to fetch companies',
      data: null,
      isSuccess: false,
    });
  }
};

const getCompanyById = async (req, res) => {
  try {
    const id = req.params.id;

    // Validate that the id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid company ID format',
        data: null,
        isSuccess: false,
      });
    }

    const company = await db.companies.findOne({
      _id: new ObjectId(id),
    });
    if (!company) {
      // User not found
      return res.status(404).json({
        message: 'Company not found',
        data: null,
        isSuccess: false,
      });
    }

    // User found
    return res.status(200).json({
      message: 'Get company detail by ID successful',
      data: company,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error fetching company by ID:', error);
    res.status(500).json({
      message: 'Failed to fetch company by ID',
      data: null,
      isSuccess: false,
    });
  }
};


const updateCompany = async (req, res) => {
  const { email } = req.body;
  const companyname = req.body.firstName.trim();
  const country = req.body.country.trim();
  const address = req.body.address.trim();
  try {
    const id = req.params.id;
    await db.companies.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          email,
          companyname,
          country,
          address,
        },
      }
    )
    const companydata= {
      email,
      firstName,
      lastName,
      dob,
      address,
    }
    await db.posts.updateMany(
      { 'author._id': new ObjectId(id) },
      {$set: {'author.userdata': companydata}})
    res.status(200).json({
      message: "Update company by id successful",
      data: { ...req.body, id: id },
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      message: 'Failed to update company',
      data: null,
      isSuccess: false,
    });
  }
};

// const acceptFriendRequest = async (req, res) => {
//   const userId = req.params.id;
//   const friendRequest = req.body.friendRequest;
//   const acceptRequest = req.body.acceptRequest;

//   try {
//     const user1 = await db.users.findOne({ _id: new ObjectId(userId) });

//     if (!user1) {
//       return res.status(404).json({ message: 'User not found', isSuccess: 0 });
//     }

//     const user2 = await db.users.findOne({ _id: new ObjectId(friendRequest._id) });

//     if (!user2) {
//       return res.status(404).json({ message: 'Friend not found', isSuccess: 0 });
//     }

//     if ( acceptRequest == true) {
//       const user1WithoutFriend = { ...user1, friend: null };
//       const user2WithoutFriend = { ...user2, friend: null };
//       delete user1WithoutFriend.friend
//       delete user2WithoutFriend.friend
//       user1.friend.push(user2WithoutFriend);
//       user2.friend.push(user1WithoutFriend);

//       user1.friendRequests = user1.friendRequests.filter(
//         (request) => request._id.toString() !== friendRequest._id.toString()
//       );
//       user2.friendRequests = user2.friendRequests.filter(
//         (request) => request._id.toString() !== userId.toString()
//       );
//     } else {
//       user1.friendRequests = user1.friendRequests.filter(
//         (request) => request._id.toString() !== friendRequest._id.toString()
//       );
//       user2.friendRequests = user2.friendRequests.filter(
//         (request) => request._id.toString() !== userId.toString()
//       );
//     }

//     await db.users.updateOne({ _id: new ObjectId(userId) }, { $set: user1 });
//     await db.users.updateOne({ _id: new ObjectId(friendRequest._id) }, { $set: user2 });

//     res.json({ message: 'Friend request processed successfully', isSuccess: 1, data: user1 });
//   } catch (error) {
//     console.error('Error processing friend request:', error);
//     res.status(500).json({ message: 'Failed to process friend request', isSuccess: 0 });
//   }
// };

// const sendFriendRequest = async (req, res) => {
//   const userId = req.params.id;
//   const friend = req.body.friend;

//   try {
//     const user = await db.users.findOne({ _id: new ObjectId(userId) });

//     if (friend.friend && friend.friend.some(req => req._id === userId)) {
//       return res.status(400).json({ message: 'Already Friend', isSuccess: 0 });
//     }

//     if (!user) {
//       return res.status(404).json({ message: 'User not found', isSuccess: 0 });
//     }

//     if (friend.friendRequests.some(request => request._id === userId)) {
//       return res.status(400).json({ message: 'Friend request already sent', isSuccess: 0 });
//     }

//     friend.friendRequests.push(user);

//     await db.users.updateOne({ _id: new ObjectId(friend._id) }, { $set: { friendRequests: friend.friendRequests } });

//     res.json({ message: 'Friend request sent successfully', isSuccess: 1 });
//   } catch (error) {
//     console.error('Error sending friend request:', error);
//     res.status(500).json({ message: 'Failed to send friend request', isSuccess: 0 });
//   }
// };

// const removeFriend = async (req, res) => {
//   const userId = req.params.id;
//   const friendId = req.body.friendId;

//   try {
//     const user = await db.users.findOne({ _id: new ObjectId(userId) });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found', isSuccess: 0 });
//     }

//     const friendToRemove = await db.users.findOne({ _id: new ObjectId(friendId) });

//     if (!friendToRemove) {
//       return res.status(404).json({ message: 'Friend not found', isSuccess: 0 });
//     }

//     // Lọc ra danh sách bạn bè mới mà không bao gồm người bạn cần xóa
//     user.friend = user.friend.filter(
//       (friend) => friend._id.toString() !== friendId.toString()
//     );

//     friendToRemove.friend = friendToRemove.friend.filter(
//       (friend) => friend._id.toString() !== userId.toString()
//     );

//     // Cập nhật lại thông tin người dùng và người bạn trong cơ sở dữ liệu
//     await db.users.updateOne({ _id: new ObjectId(userId) }, { $set: user });
//     await db.users.updateOne({ _id: new ObjectId(friendId) }, { $set: friendToRemove });

//     res.json({ message: 'Friend removed successfully', isSuccess: 1, data: user });
//   } catch (error) {
//     console.error('Error removing friend:', error);
//     res.status(500).json({ message: 'Failed to remove friend', isSuccess: 0 });
//   }
// };

const searchCompanies = async (req, res) => {
  try {
    const query = req.query.searchTerm;
    const searchResults = await db.companies.find({
      $or: [
        { companyname: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).toArray();

    res.status(200).json({
      message: "Search companies successful",
      data: searchResults,
      isSuccess: true,
    });
  } catch (error) {
    console.error('Error searching companies:', error);
    res.status(500).json({
      message: 'Failed to search companies',
      data: null,
      isSuccess: false,
    });
  }
};



// const updatePictures=async (req, res) => {
//   try {
//     // Kiểm tra xem có file được tải lên hay không
//     if (!req.file) {
//       return res.status(400).json({ error: 'Vui lòng chọn ảnh' });
//     }

//     // Chuyển đổi đối tượng Buffer thành chuỗi base64
//     const imageBuffer = req.file.buffer.toString('base64');

//     // Tải ảnh lên Cloudinary vào thư mục profile-pictures
//     const result = await cloudinary.uploader.upload(`data:image/png;base64,${imageBuffer}`, {
//       folder: 'profile-pictures',
//       public_id: `${req.params.id}_${Date.now()}`
//     });

//     // Lấy URL của ảnh từ kết quả trả về
//     const profilePictureUrl = result.secure_url;
//     console.log(req.params.id)
//     await db.users.updateOne(
//       { _id: new ObjectId(req.params.id) },
//       { $set: { profilePictureUrl } }
//     );

//     await db.posts.updateMany(
//       { 'author._id': new ObjectId(req.params.id) },
//       { $set: { 'author.userdata.profilePictureUrl': profilePictureUrl } }
//     );
//     await db.comments.updateMany(
//       { 'author._id':req.params.id },
//       { $set: { 'author.profilePictureUrl': profilePictureUrl } }
//     );

//     res.json({ message: 'Successfully', profilePictureUrl });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Error' });
//   }
// }


module.exports = {
  getCompanies,
  getCompanyById,
  updateCompany,
  searchCompanies,
};
