const express = require('express');
const bcrypt = require('bcrypt');
const { authenticateGrampanchayat, authenticateUser} = require('../../middlewear/auth');
const GramUser = require('../../models/GramUser');
const router = express.Router();
const crypto = require('crypto');
const generateToken = require('../../middlewear/token');
const UserComplaint = require('../../models/UserComplaint');
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const PhedUser = require('../../models/PhedUser');
const Worker = require('../../models/Worker');
const Grampanchayat = require('../../models/Grampanchayat');
const Bill = require('../../models/Bill');
const Announcement = require('../../models/Announcement');
const models = {
  GramUser,
  PhedUser,
  Worker,
  Grampanchayat,
};
const mongoose = require('mongoose');


// Register a new user
//http://localhost:5050/v1/api/user/register
router.post('/register', authenticateGrampanchayat, async (req, res) => {
    const { name, address, mobileNo, number_aadhar } = req.body;
    const grampanchayatId = req.user._id; // Get the Grampanchayat ID from the authenticated user

    try {
        // Validate required fields
        if (!name || !address || !mobileNo || !number_aadhar) {
            return res.status(400).json({ success: false, message: 'Name, address , mobile number, and Aadhar number are required.' });
        }

        // Check if user already exists with mobile number or Aadhar
        const existingUser = await GramUser.findOne({ $or: [{ mobileNo }, { number_aadhar }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this mobile number or Aadhar number.' });
        }

        // Generate unique consumerId
        // const consumerId = crypto.randomBytes(8).toString('hex').toUpperCase();
        const prefix = "CU";
        const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generates a number between 1000 and 9999
        const  consumerId =  `${prefix}${randomNumber}`;

        // Generate a temporary password (it could also be set by Grampanchayat if required)
        const password = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with the Grampanchayat's ID
        const newUser = new GramUser({
            name,
            address, // Pass the address object directly
            mobileNo,
            number_aadhar,
            consumerId,
            password: hashedPassword,
            grampanchayatId,  // The ID is fetched from the token (Grampanchayat's ID)
        });

        // Save the user to the database
        await newUser.save();

        // Return consumerId and password (for initial login)
        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            consumerId,  // Return the generated consumerId
            password,    // Return the password (for initial login)
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ success: false, message: 'Error registering user.', error });
    }
});

// Login Route
//http://localhost:5050/v1/api/user/login
router.post('/login', async (req, res) => {
    const { mobileNo, consumerId, password } = req.body;
  
    try {
      // Validate required fields
      if (!mobileNo && !consumerId) {
        return res.status(400).json({ success: false, message: 'Mobile number or Consumer ID is required.' });
      }
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required.' });
      }
  
      // Find the user by mobile number or consumerId
      let user;
      if (mobileNo) {
        user = await GramUser.findOne({ mobileNo });
      } else if (consumerId) {
        user = await GramUser.findOne({ consumerId });
      }
  
      // If no user is found, send an error
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
  
      // Compare the provided password with the stored password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid password.' });
      }
  
      // Generate a JWT token
      const token = generateToken(user._id, 'user');  // Pass user ID and role
  
      // Return the token in the response
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,  // Return the generated token
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ success: false, message: 'Error logging in user.', error });
    }
  });

  // list of all user
  //http://localhost:5050/v1/api/user/list
  router.get('/list', async (req, res) => {
    try {
        // Fetch all users and populate Grampanchayat details, excluding passwords
        const users = await GramUser.find()
            .select('-password') // Exclude user password
            .populate('grampanchayatId', '-password'); // Exclude Grampanchayat password

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No users found.',
            });
        }

        // Return the list of users with Grampanchayat details (password excluded)
        res.status(200).json({
            success: true,
            message: 'Users fetched successfully.',
            users,  // Return the list of users with populated Grampanchayat details
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users.',
            error,
        });
    }
});


 // user details fetch
  //http://localhost:5050/v1/api/user/profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
      const userId = req.user._id; // The user is already added to the request object by the middleware
      // const user = await User.findById(userId).populate('grampanchayatId'); // Populate the grampanchayatId field

      const user = await GramUser.findById(userId)
      .populate('grampanchayatId', '-password');

      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found',
          });
      }

      // Return the user details along with the Grampanchayat details
      res.status(200).json({
          success: true,
          message: 'User profile fetched successfully',
          data: {
              user: {
                  _id: user._id,
                  name: user.name,
                  address: user.address,
                  number_aadhar: user.number_aadhar,
                  mobileNo: user.mobileNo,
                  consumerId: user.consumerId,
                  status: user.status,
                  createdAt: user.createdAt,
                  updatedAt: user.updatedAt,
              },
          },
      });
  } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({
          success: false,
          message: 'An error occurred while fetching user profile',
          error: error.message,
      });
  }
});



// http://localhost:5050/v1/api/user/:id --> mongoose id
router.get('/:id', async (req, res) => {
    const { id } = req.params; // Extract user ID from the request parameters
  
    try {
      // Fetch the user by ID, excluding the password and populating Grampanchayat details
      const user = await GramUser.findById(id)
        .select('-password') // Exclude the user password
        .populate('grampanchayatId', '-password'); // Exclude Grampanchayat password
  
      // Check if the user exists
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
  
      // Return the user with populated Grampanchayat details
      res.status(200).json({
        success: true,
        message: 'User fetched successfully.',
        user,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user.',
        error: error.message,
      });
    }
  });
  
  // create user complaint
  //http://localhost:5050/v1/api/user/complaint
  router.post('/complaint', async (req, res) => {
    const { userId, complaintDetails, grampanchayatId } = req.body;
  
    if (!userId || !complaintDetails || !grampanchayatId) {
      return res.status(400).json({
        success: false,
        message: 'User ID, complaint details, and Grampanchayat ID are required.',
      });
    }
  
    try {
      const newComplaint = new UserComplaint({
        userId,
        complaintDetails,
        grampanchayatId,
      });
  
      const savedComplaint = await newComplaint.save();
  
      res.status(201).json({
        success: true,
        message: 'User complaint created successfully.',
        complaint: savedComplaint,
      });
    } catch (error) {
      console.error('Error creating user complaint:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
        error: error.message,
      });
    }
  });
  
  // get complaints by grampanchayat id 
  //http://localhost:5050/v1/api/user/complaint/by-gram/:grampanchayatId
  router.get('/complaint/by-gram/:grampanchayatId', async (req, res) => {
    const { grampanchayatId } = req.params;
  
    try {
      // Validate that grampanchayatId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(grampanchayatId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Grampanchayat ID. Must be a valid ObjectId.',
        });
      }
  
      // Fetch complaints by Grampanchayat ID
      const complaints = await UserComplaint.find({ grampanchayatId })
        .populate('userId', 'name mobile consumerId mobileNo address') // Populate user info
        .populate('grampanchayatId', 'name pincode mobile city address'); // Populate Grampanchayat info
  
      if (!complaints || complaints.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No complaints found for this Grampanchayat.',
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Complaints retrieved successfully.',
        complaints,
      });
    } catch (error) {
      console.error('Error fetching complaints by Grampanchayat ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
        error: error.message,
      });
    }
  });
  
  //http://localhost:5050/v1/api/user/complaint/list
  router.get('/complaint/list', async (req, res) => {
    try {
      const complaints = await UserComplaint.find()
        .populate('userId', 'name mobile consumerId mobileNo address') // Populate user info
        .populate('grampanchayatId', 'name pincode mobile city '); // Populate Grampanchayat info
  
      if (!complaints || complaints.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No complaints found.',
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Complaints retrieved successfully.',
        complaints,
      });
    } catch (error) {
      console.error('Error fetching user complaints:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
        error: error.message,
      });
    }
  });

  //http://localhost:5050/v1/api/user/complaint/by-user/:userId
  router.get('/complaint/by-user/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Fetch complaints by userId
      const complaints = await UserComplaint.find({ userId })
        .populate('userId', 'name mobile consumerId mobileNo address') // Populate user info
        .populate('grampanchayatId', 'name pincode mobile city address'); // Populate Grampanchayat info
  
      if (!complaints || complaints.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No complaints found for this user.',
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Complaints retrieved successfully.',
        complaints,
      });
    } catch (error) {
      console.error('Error fetching complaints by User ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
        error: error.message,
      });
    }
  });

  router.put('/complaint/status/:id', async (req, res) => {
    try {
      const { id } = req.params; // MongoDB _id of the complaint
      const { status } = req.body;
  
      // Validate the provided status
      const validStatuses = ['Pending', 'Resolved'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Status must be one of the following: ${validStatuses.join(', ')}`,
        });
      }
  
      // Validate the MongoDB _id format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid complaint ID.',
        });
      }
  
      // Find and update the complaint
      const updatedComplaint = await UserComplaint.findByIdAndUpdate(
        id, // Find by MongoDB _id
        { status }, // Update the status field
        { new: true } // Return the updated document
      );
  
      if (!updatedComplaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Complaint status updated successfully.',
        complaint: updatedComplaint,
      });
    } catch (error) {
      console.error('Error updating complaint status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
        error: error.message,
      });
    }
  });


router.post('/otp-login', async (req, res) => {
  const { mobile, userType } = req.body;

  if (!mobile || !userType) {
    return res.status(400).json({ message: 'Mobile number and user type are required.' });
  }

  if (!models[userType]) {
    return res.status(400).json({ message: 'Invalid user type.' });
  }

  try {
    const userModel = models[userType];
    let user;
    // Find user by mobile
    if(userType == 'GramUser'){
      user = await userModel.findOne({ mobileNo: mobile });
    } else if(userType == 'Grampanchayat'){
      user = await userModel.findOne({ mobile: mobile });
    } else {
      user = await userModel.findOne({ mobile: mobile });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate OTP and set expiry time
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    user.OTP = otp;
    user.OTPExpires = otpExpiry;

    await user.save();

    // Send OTP via Twilio
    await client.messages.create({
      body: `Your OTP is ${otp}. It is valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      to: "+91"+mobile,
    });

    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { mobile, userType, otp } = req.body;

  if (!mobile || !userType || !otp) {
    return res.status(400).json({ message: 'Mobile, user type, and OTP are required.' });
  }

  if (!models[userType]) {
    return res.status(400).json({ message: 'Invalid user type.' });
  }

  try {
    const userModel = models[userType];
    let user;
    // Find user by mobile
    if(userType == 'GramUser'){
      user = await userModel.findOne({ mobileNo: mobile });
    }else{
      user = await userModel.findOne({ mobile: mobile });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    console.log(user)
    // Check if OTP matches and is not expired
    if (user.OTP != otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Clear OTP and expiry after successful verification
    user.OTP = null;
    user.OTPExpires = null;

    await user.save();

      // Generate a JWT token
      let token
      if(userType == 'GramUser'){
        token = generateToken(user._id, 'user');  // Pass user ID and role
      }else if (userType == 'Grampanchayat'){
         token = generateToken(user._id, 'grampanchayat');  // Pass user ID and role
      }else if(userType == 'Worker'){
        token = generateToken(user._id, 'worker');  // Pass user ID and role
      }else{
        token = generateToken(user._id, 'pheduser'); 
      }
  
    res.status(200).json({ message: 'Login successful.', user: user, token:token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});



// GET  http://localhost:5050/v1/api/user/get-bill/:consumerId
router.get("/get-bill/:consumerId", async (req, res) => {
  console.log("consumer Id" );
   
    const { consumerId } = req.params; // Get consumerId from the request parameters
    try {
        // Find bills for the given consumerId and the authenticated Gram Panchayat
        const bills = await Bill.find({ consumerId: consumerId });

        if (bills.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No bills found for the specified consumer ID"
            });
        }

        res.status(200).json({
            success: true,
            message: "Bills retrieved successfully",
            data: bills
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching bills",
            error: error.message
        });
    }
});




// POST API to send an announcement to a specific user by _id (from params)
// http://localhost:5050/v1/api/user/announcements/67540400abcf60aeba862bf1
router.post('/announcements/:receiver', async (req, res) => {
  try {
    const { receiver } = req.params; // Get receiver (User  _id) from URL params
    const { message } = req.body; // Get message from the request body

    // Validate request data
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Validate the receiver (User ) ID format
    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }

    // Check if User with the provided _id exists
    const user = await GramUser.findById(receiver);
    if (!user) {
      return res.status(404).json({ error: 'User  not found.' });
    }

    // Create and save the announcement
    const announcement = new Announcement({
      message,
      receiver: user._id,
    });

    const savedAnnouncement = await announcement.save();

    res.status(201).json({
      message: 'Announcement sent successfully to User.',
      data: savedAnnouncement,
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET API to retrieve all announcements for a specific user by _id (from params)
// http://localhost:5050/v1/api/user/announcements/67540400abcf60aeba862bf1
router.get('/announcements/:receiver', async (req, res) => {
  try {
    const { receiver } = req.params; // Get receiver (User  _id) from URL params

    // Validate the receiver (User ) ID format
    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }

    // Check if User with the provided _id exists
    const user = await GramUser.findById(receiver);
    if (!user) {
      return res.status(404).json({ error: 'User  not found.' });
    }

    // Retrieve all announcements for the user
    const announcements = await Announcement.find({ receiver: user._id });

    res.status(200).json({
      message: 'Announcements retrieved successfully.',
      data: announcements,
    });
  } catch (error) {
    console.error('Error retrieving announcements:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




module.exports = router;
