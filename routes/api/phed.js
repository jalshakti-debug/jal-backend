require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const AssetPhed = require('../../models/phedAssets');
const PhedUser = require('../../models/PhedUser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const generateToken = require('../../middlewear/token')
const router = express.Router();
const InventoryPhed = require('../../models/InventoryGp')
const Grampanchayat = require('../../models/Grampanchayat');
const AssetGp = require('../../models/gpAssets'); // Correct path to gpAssets.js
const {authenticateGrampanchayat, authenticateUser, authenticatePhedUser} = require('../../middlewear/auth');
const Announcement = require('../../models/Announcement'); // Import the Announcement model
//---------------------------------------

/**
 * @route   POST http://localhost:5050/v1/api/phed/register
 * @desc    Register a new user
 */
router.post('/register', async (req, res) => {
  const { name, mobile, phed_id, password } = req.body;

  try {
    const existingUser = await PhedUser.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this mobile number.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new PhedUser({ name, mobile, phed_id, password: hashedPassword });
    await user.save();

    res.status(201).json({ success: true, message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ success: false, message: 'Error registering user.', error });
  }
});
/**
 * @route   POST http://localhost:5050/v1/api/phed/login
 * @desc    Log in a user and return a JWT token
 */
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;

  try {
    // Validate input
    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'Mobile number and password are required.' });
    }

    // Find user by mobile
    const user = await PhedUser.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Generate a token for the user
    const token = generateToken(user._id, 'pheduser'); // You can include the role as needed

    // Send successful response
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in user.',
      error: error.message,
    });
  }
});

/**
 * @route   GET http://localhost:5050/v1/api/phed/detail
 * @desc    Get the logged-in user's profile
 */
router.get('/detail', async (req, res) => {
  const token = req.headers['x-auth-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized access. Token required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await PhedUser.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.', error });
  }
});


//---------------------------------------

// Get assets for a specific Gram Panchayat
// http://localhost:5050/v1/api/phed/assets/:grampanchayatId
router.get('/assets/:grampanchayatId', async (req, res) => {
  try {
      const { grampanchayatId } = req.params;

      // Fetch assets for the specified Gram Panchayat
      const assets = await AssetGp.find({ grampanchayatId });

      // Check if no assets are found for the specified GP
      if (assets.length === 0) {
          return res.status(404).json({
              success: false,
              message: `No assets found for Gram Panchayat with ID: ${grampanchayatId}.`,
          });
      }

      // Respond with the list of assets for the specified GP
      res.status(200).json({
          success: true,
          message: 'Assets fetched successfully.',
          data: assets,
      });
  } catch (error) {
      console.error('Error fetching assets for Gram Panchayat:', error);
      res.status(500).json({
          success: false,
          message: 'An error occurred while fetching assets.',
          error: error.message,
      });
  }
});


// Get inventory for a specific Gram Panchayat
// http://localhost:5050/v1/api/phed/inventory/:grampanchayatId
router.get('/inventory/:grampanchayatId', async (req, res) => {
  try {
      const { grampanchayatId } = req.params;

      // Fetch inventory for the specified Gram Panchayat
      const inventoryItems = await InventoryGp.find({ grampanchayatId });

      // Check if no inventory items are found for the specified GP
      if (inventoryItems.length === 0) {
          return res.status(404).json({
              success: false,
              message: `No inventory items found for Gram Panchayat with ID: ${grampanchayatId}.`,
          });
      }

      // Respond with the list of inventory items for the specified GP
      res.status(200).json({
          success: true,
          message: 'Inventory items fetched successfully.',
          data: inventoryItems,
      });
  } catch (error) {
      console.error('Error fetching inventory for Gram Panchayat:', error);
      res.status(500).json({
          success: false,
          message: 'An error occurred while fetching inventory.',
          error: error.message,
      });
  }
});

// Create Announcement
// http://localhost:5050/v1/api/phed//announcements/:grampanchayatId
router.post('/announcements/:grampanchayatId', async (req, res) => {
  const { message } = req.body;
  const { grampanchayatId } = req.params; // Get grampanchayatId from the route params

  // Basic validation for message
  if (!message ) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  if (!grampanchayatId ) {
    return res.status(400).json({ success: false, message: 'Grampanchayat ID is required' });
  }

  try {
    // Debug log: Check what grampanchayatId is being passed
    console.log('Received grampanchayatId:', grampanchayatId);

    // Check if Grampanchayat exists using the provided grampanchayatId
    const grampanchayat = await Grampanchayat.findOne({ grampanchayatId });

    // Debug log: Output if Grampanchayat is found or not
    if (!grampanchayat) {
      console.log('Grampanchayat not found:', grampanchayatId);
      return res.status(404).json({ success: false, message: 'Grampanchayat not found' });
    }

    // Create the announcement with the received data
    const announcement = new Announcement({
      message,
      grampanchayatId,
      receiver: grampanchayat._id, // Set the receiver field to Grampanchayat's ObjectId
    });

    // Save the announcement to the database
    await announcement.save();

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Announcement sent successfully',
      announcement,
    });

  } catch (error) {
    console.error('Error sending announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});






module.exports = router;
