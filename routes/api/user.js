const express = require('express');
const bcrypt = require('bcrypt');
const { authenticateGrampanchayat, authenticateUser} = require('../../middlewear/auth');
const GramUser = require('../../models/GramUser');
const router = express.Router();
const crypto = require('crypto');
const generateToken = require('../../middlewear/token')




// Register a new user
//http://localhost:5050/v1/api/user/register
router.post('/register', authenticateGrampanchayat, async (req, res) => {
    const { name, address, mobileNo, number_aadhar } = req.body;
    const grampanchayatId = req.user._id; // Get the Grampanchayat ID from the authenticated user

    try {
        // Validate required fields
        if (!name || !address || !address.houseNo || !address.city || !address.pincode || !mobileNo || !number_aadhar) {
            return res.status(400).json({ success: false, message: 'Name, address (houseNo, city, pincode), mobile number, and Aadhar number are required.' });
        }

        // Check if user already exists with mobile number or Aadhar
        const existingUser = await GramUser.findOne({ $or: [{ mobileNo }, { number_aadhar }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this mobile number or Aadhar number.' });
        }

        // Generate unique consumerId
        const consumerId = crypto.randomBytes(8).toString('hex').toUpperCase();

        // Generate a temporary password (it could also be set by Grampanchayat if required)
        const password = crypto.randomBytes(6).toString('hex');
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




// User can add complain
  //http://localhost:5050/v1/api/user/usercomplaint
  router.post('/usercomplaint', authenticateUser , async (req, res) => {
    try {
        const {complaintId, complaintDetails, status } = req.body;
  
        // Check if the complaint details are provided
        if (!complaintDetails) {
            return res.status(400).json({
                success: false,
                message: 'Complaint details are required.',
            });
        }
  
        // Get the consumerId from the authenticated user
        const consumerId = req.user.consumerId; // Use consumerId instead of userId
        const grampanchayatId = req.user.grampanchayatId; // Get the Grampanchayat ID from the authenticated user
  
        // Prepare the data for the new UserComplaint record
        const userComplaintData = {
            consumerId, // Use consumerId instead of userId
            complaintDetails,
            status: status || 'Pending', // Default status is 'Pending'
            grampanchayatId, // Link the complaint to the user's Grampanchayat
            complaintId,
        };
  
        // Create a new UserComplaint instance
        const newUserComplaint = new UserComplaint(userComplaintData);
  
        // Save the new complaint
        const savedUserComplaint = await newUserComplaint.save();
  
        // Return the response
        res.status(201).json({
            success: true,
            message: 'User  complaint created successfully!',
            data: savedUserComplaint,
        });
    } catch (error) {
        console.error('Error creating user complaint:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the user complaint.',
            error: error.message,
        });
    }
  });

module.exports = router;
