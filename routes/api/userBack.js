const express = require('express');
const router = express.Router();
const User = require('../../models/GramUser');
const crypto = require('crypto'); // Used for generating unique password
const {authenticateGrampanchayat , authenticateUser } = require('../../middlewear/auth'); 
const bcrypt = require('bcrypt'); // To hash the password
const jwt = require('jsonwebtoken'); 
const UserComplaint = require('../../models/UserComplaint');

function generateRandomPassword() {
    return crypto.randomBytes(8).toString('hex'); // Generates a random 16-character password
  }
// User Registration Route (Only accessible by authenticated Grampanchayat)

router.post('/register', authenticateGrampanchayat, async (req, res) => {
    const { name, address, mobileNo,number_aadhar } = req.body;

    // Validate input fields
    if (!name || !address || !number_aadhar || !mobileNo) {
        return res.status(400).json({
            success: false,
            message: 'All fields (name, address, mobileNo ,number_aadhar) are required',
        });
    }
    const mobileNoRegex = /^[0-9]{10}$/;
    if (!mobileNoRegex.test(mobileNo)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid mobile number. It should be a 10-digit number.',
        });
    }

    // Validate number_aadhar (Must be a 12-digit number)
    const aadharRegex = /^[0-9]{12}$/;
    if (!aadharRegex.test(number_aadhar)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid Aadhar number. It should be a 12-digit number.',
        });
    }

    // Ensure aadharNo is valid (not null, empty or undefined)
 

    try {
        // Check if the mobile number already exists
        const existingUser = await User.findOne({ mobileNo });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is already registered',
            });
        }

        // Check if the aadhar number already exists
        const existingAadhar = await User.findOne({ number_aadhar });
        if (existingAadhar) {
            return res.status(400).json({
                success: false,
                message: 'Aadhar number is already registered',
            });
        }

        // Generate a unique consumerId (can be a UUID or auto-generated string)
        const consumerId = 'CP-' + Date.now(); // Simple example, you can improve this logic

        // Generate a random password for the user
        const randomPassword = generateRandomPassword();  // Assuming generateRandomPassword() is defined elsewhere

        // Create a new user
        const newUser = new User({
            name,
            number_aadhar,
            address,
            mobileNo,
            consumerId,
            password: randomPassword, 
            grampanchayatId: req.grampanchayat._id,  // Store the plain-text password
        });
        console.log("newUser-->",newUser);

        // Save the user
        const savedUser = await newUser.save();

        // Respond with success and send the user details (including the generated password)
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: savedUser._id,
                name: savedUser.name,
                number_aadhar: savedUser.number_aadhar,
                mobileNo: savedUser.mobileNo,
                consumerId: savedUser.consumerId,
                password: randomPassword,  // Send the plain-text password back (you can display this to the user)
            },
        });
    } catch (error) {
        console.error('Error while registering user:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while registering the user',
            error: error.message,
        });
    }
});


router.post('/login', async (req, res) => {
    const { mobileNo, consumerId, password } = req.body;
  
    // Validate input fields
    if (!mobileNo || !consumerId || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (mobileNo, consumerId, password) are required',
      });
    }
  
    try {
      // Find the user by mobileNo or consumerId
      const user = await User.findOne({ $or: [{ mobileNo }, { consumerId }] });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please check your credentials.',
        });
      }
  
      // Check if the password is correct
      const isPasswordValid = await user.matchPassword(password);
  
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password. Please try again.',
        });
      }
  
      // Generate a JWT token
      const token = jwt.sign(
        { _id: user._id, consumerId: user.consumerId }, // Payload data
        process.env.JWT_SECRET, // Secret key for signing the token
        { expiresIn: '1h' } // Token expiry time (can adjust as needed)
      );
  
      // Respond with success and the token
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token: token,  // Send the token to the client
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during login',
        error: error.message,
      });
    }
  });


  router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user._id; // The user is already added to the request object by the middleware
        // const user = await User.findById(userId).populate('grampanchayatId'); // Populate the grampanchayatId field

        const user = await User.findById(userId)
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
                grampanchayat: user.grampanchayatId,  // This will include all the Grampanchayat details
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


//http://localhost:5050/v1/api/user/usercomplaint user complaint
router.post('/usercomplaint', authenticateUser, async (req, res) => {
    try {
        console.log("req-->",req.user);
        const { complaintDetails, status } = req.body;

        // Check if the complaint details are provided
        if (!complaintDetails) {
            return res.status(400).json({
                success: false,
                message: 'Complaint details are required.',
            });
        }

        // Get the userId and grampanchayatId from the authenticated user
        const userId = req.user._id;
        const grampanchayatId = req.user.grampanchayatId;  // Get the Grampanchayat ID from the authenticated user

        // Prepare the data for the new UserComplaint record
        const userComplaintData = {
            userId,
            complaintDetails,  // The actual complaint (reference to Complaint model)
            status: status || 'Pending',  // Default status is 'Pending'
            grampanchayatId,  // Link the complaint to the user's Grampanchayat
        };

        // Create a new UserComplaint instance
        const newUserComplaint = new UserComplaint(userComplaintData);

        // Save the new complaint
        const savedUserComplaint = await newUserComplaint.save();

        // Return the response
        res.status(201).json({
            success: true,
            message: 'User complaint created successfully!',
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

// ------------------------------------------------------
//http://localhost:5050/v1/api/user/usercomplaints/673dc6b0e3ec6d8eb2945b26
router.put('/usercomplaints/:complaintId', authenticateGrampanchayat, async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { status } = req.body;

        // Validate the status field
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required.',
            });
        }

        // Check if the status is a valid value (optional, based on your business rules)
        const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Closed']; // Example valid statuses
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid values are: ${validStatuses.join(', ')}`,
            });
        }

        // Find the complaint by complaintId
        const complaint = await UserComplaint.findById(complaintId);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found.',
            });
        }

        // Check if the authenticated Grampanchayat is allowed to update this complaint
        if (complaint.grampanchayatId.toString() !== req.grampanchayat._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to change the status of this complaint.',
            });
        }

        // Update the status of the complaint
        complaint.status = status;

        // Save the updated complaint
        const updatedComplaint = await complaint.save();

        // Respond with the updated complaint data
        res.status(200).json({
            success: true,
            message: 'Complaint status updated successfully.',
            data: updatedComplaint,
        });
    } catch (error) {
        console.error('Error updating complaint status:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the complaint status.',
            error: error.message,
        });
    }
});
// ------------------------------------------------------

//http://localhost:5050/v1/api/user/usercomplaints/list   user complaint
router.get('/usercomplaints/list', async (req, res) => {
    try {
        // Fetch all user complaints, and populate user details and grampanchayat info
        const complaints = await UserComplaint.find()
            .populate('userId', 'name mobileNo consumerId') // Populating user details (name, mobileNo, consumerId)
            .populate('grampanchayatId', 'name') // Populating Grampanchayat details (name)
            .populate('complaintDetails', 'description status'); // Populating complaint details

        // Check if no complaints are found
        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No complaints found',
            });
        }

        // Respond with the list of complaints
        res.status(200).json({
            success: true,
            message: 'Complaints fetched successfully',
            data: complaints,
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching complaints',
            error: error.message,
        });
    }
});

// http://localhost:5050/v1/api/user/usercomplaints/673d6ce09aae44c95e4518a8 user complaint
router.get('/usercomplaints/:userId', async (req, res) => {
    try {
        // Get the userId from the route parameters
        const { userId } = req.params;

        // Fetch complaints for the specified userId
        const complaints = await UserComplaint.find({ userId })
            .populate('userId', 'name mobileNo consumerId') // Populating user details (name, mobileNo, consumerId)
            .populate('grampanchayatId', 'name') // Populating Grampanchayat details (name)
            .populate('complaintDetails', 'description status'); // Populating complaint details

        // Check if no complaints are found for the user
        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No complaints found for this user',
            });
        }

        // Respond with the list of complaints
        res.status(200).json({
            success: true,
            message: 'Complaints fetched successfully',
            data: complaints,
        });
    } catch (error) {
        console.error('Error fetching complaints for user:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching complaints for this user',
            error: error.message,
        });
    }
});

// Route to list all complaints for a specific Grampanchayat (based on grampanchayatId)
//http://localhost:5050/v1/api/user/usercomplaints/gram/673da4d543c121a4abff7221
router.get('/usercomplaints/gram/:grampanchayatId', async (req, res) => {
    try {
        // Get the grampanchayatId from the route parameters
        const { grampanchayatId } = req.params;

        // Fetch complaints for the specified grampanchayatId
        const complaints = await UserComplaint.find({ grampanchayatId })
            .populate('userId', 'name mobileNo consumerId') // Populating user details (name, mobileNo, consumerId)
            .populate('grampanchayatId', 'name') // Populating Grampanchayat details (name)
            .populate('complaintDetails', 'description status'); // Populating complaint details

        // Check if no complaints are found for the grampanchayatId
        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No complaints found for this Grampanchayat',
            });
        }

        // Respond with the list of complaints
        res.status(200).json({
            success: true,
            message: 'Complaints for Grampanchayat fetched successfully',
            data: complaints,
        });
    } catch (error) {
        console.error('Error fetching complaints for Grampanchayat:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching complaints for this Grampanchayat',
            error: error.message,
        });
    }
});
module.exports = router;

