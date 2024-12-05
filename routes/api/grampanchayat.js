const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = require('../../middlewear/token'); 
const Grampanchayat = require('../../models/Grampanchayat');
const {authenticateGrampanchayat, authenticateUser, authenticatePhedUser} = require('../../middlewear/auth');
const AssetGp = require('../../models/gpAssets'); // Correct path to gpAssets.js
const { AssetContextImpl } = require('twilio/lib/rest/serverless/v1/service/asset');
const InventoryGp = require('../../models/InventoryGp');
const router = express.Router();
//http://localhost:5050/v1/api/grampanchayat/register
router.post('/register', async (req, res) => {
    const { name, grampanchayatId, address, villageName, city, district, state, pincode, mobile, password} = req.body;

    try {
        if ( !name || !grampanchayatId || !address || !villageName || !city || !district || !state || !pincode || !mobile || !password ) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // Check if the Grampanchayat already exists
        const existingGrampanchayat = await Grampanchayat.findOne({ grampanchayatId });
        if (existingGrampanchayat) {
            return res.status(400).json({ success: false, message: 'Grampanchayat already registered.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new Grampanchayat
        const newGrampanchayat = new Grampanchayat({
            name,
            grampanchayatId,
            address,
            villageName,
            city,
            district,
            state,
            pincode,
            mobile,
            password: hashedPassword,
        });

        // Save to the database
        const savedGrampanchayat = await newGrampanchayat.save();

        res.status(201).json({
            success: true,
            message: 'Grampanchayat registered successfully.',
            data: savedGrampanchayat,
        });
    } catch (error) {
        console.error('Error during Grampanchayat registration:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// Login API
// http://localhost:5050/v1/api/grampanchayat/login
router.post('/login', async (req, res) => {
    const { grampanchayatId, password } = req.body;

    try {
        // Validate input
        if (!grampanchayatId || !password) {
            return res.status(400).json({ success: false, message: 'Grampanchayat ID and password are required.' });
        }

        // Check if the Grampanchayat exists
        const grampanchayat = await Grampanchayat.findOne({ grampanchayatId });
        if (!grampanchayat) {
            return res.status(404).json({ success: false, message: 'Grampanchayat not found.' });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, grampanchayat.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Generate token with role "grampanchayat"
        const token = generateToken(grampanchayat._id, 'grampanchayat');

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
        });
    } catch (error) {
        console.error('Error during Grampanchayat login:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

//list of all Grampanchayat
// http://localhost:5050/v1/api/grampanchayat/list main
// search by city name http://localhost:5050/v1/api/grampanchayat/list?city=nuh
router.get('/list', async (req, res) => {
    const { city } = req.query;

    try {
        // Query to fetch Grampanchayats
        const query = city
            ? { city: { $regex: new RegExp(city, 'i') } } // Case-insensitive search
            : {};

        // Fetch Grampanchayats and exclude the password field
        const grampanchayats = await Grampanchayat.find(query).select('-password');

        // Check if the list is empty
        if (!grampanchayats.length) {
            return res.status(404).json({
                success: false,
                message: city
                    ? `No Grampanchayats found in the city: ${city}.`
                    : 'No Grampanchayats found.',
            });
        }

        res.status(200).json({
            success: true,
            message: city
                ? `Grampanchayats in the city: ${city} retrieved successfully.`
                : 'All Grampanchayats retrieved successfully.',
            data: grampanchayats,
        });
    } catch (error) {
        console.error('Error retrieving Grampanchayats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
});

// Update API
// http://localhost:5050/v1/api/grampanchayat/update/:id
router.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { name, address, villageName, city, district, state, pincode, status } = req.body;

    try {
        // Validate input
        if (!id) {
            return res.status(400).json({ success: false, message: 'Grampanchayat ID is required.' });
        }

        // Check if the Grampanchayat exists
        const grampanchayat = await Grampanchayat.findById(id);
        if (!grampanchayat) {
            return res.status(404).json({ success: false, message: 'Grampanchayat not found.' });
        }

        // Update fields
        if (name) grampanchayat.name = name;
        if (address) grampanchayat.address = address;
        if (villageName) grampanchayat.villageName = villageName;
        if (city) grampanchayat.city = city;
        if (district) grampanchayat.district = district;
        if (state) grampanchayat.state = state;
        if (pincode) grampanchayat.pincode = pincode;
        if (status !== undefined) grampanchayat.status = status;

        // Save the updated Grampanchayat
        const updatedGrampanchayat = await grampanchayat.save();

        res.status(200).json({
            success: true,
            message: 'Grampanchayat updated successfully.',
            data: updatedGrampanchayat,
        });
    } catch (error) {
        console.error('Error during Grampanchayat update:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});



// Add a new asset
// http://localhost:5050/v1/api/grampanchayat/addAsset
router.post('/addAsset', authenticateGrampanchayat, async (req, res) => {
  try {
      const { name } = req.body;
      const grampanchayatId = req.user._id; // Get the Grampanchayat ID from the authenticated user


      if (!name) {
          return res.status(400).json({ message: 'Asset name is required.' });
      }

      const existingAsset = await AssetGp.findOne({ name, grampanchayatId });
      if (existingAsset) {
          return res.status(400).json({ message: 'Asset already exists.' });
      }

      const newAsset = new AssetGp({ name, grampanchayatId });
      await newAsset.save();

      return res.status(201).json({ message: 'Asset added successfully.', asset: newAsset });
  } catch (error) {
      return res.status(500).json({ message: 'Server error.', error: error.message });
  }
});




// Add quantity to an existing asset
// http://localhost:5050/v1/api/grampanchayat/addQuantity
router.put('/addQuantity', authenticateGrampanchayat, async (req, res) => {
  try {
      const { name, quantityToAdd, description } = req.body;
      const grampanchayatId = req.user._id;

      // Validate input
      if (!name || quantityToAdd === undefined) {
          return res.status(400).json({ message: 'Asset name and quantity to add are required.' });
      }

      if (!description) {
          return res.status(400).json({ message: 'Description is required when adding quantity.' });
      }

      // Use case-insensitive query to find the asset
      const asset = await AssetGp.findOne({ name: new RegExp(`^${name}$`, 'i'), grampanchayatId });

      if (!asset) {
          return res.status(404).json({ message: 'Asset not found.' });
      }

      const previousQuantity = asset.quantity; // Store previous quantity for logging
      asset.quantity = Number(asset.quantity) + Number(quantityToAdd); // Ensure both are treated as numbers
      asset.editHistory.push({
          date: new Date(), // Add the current date
          quantityAdded: Number(quantityToAdd), // Ensure quantity added is a number
          updatedQuantity: asset.quantity, // New updated quantity
          description, // Add description to edit history
          creditOrDebit: 'credit', // Indicate this is a credit operation
      });

      await asset.save(); // Save the updated asset

      // Return updated asset with edit history
      return res.status(200).json({
          message: 'Quantity added successfully.',
          asset: {
              name: asset.name,
              previousQuantity, // Include previous quantity for reference
              newQuantity: asset.quantity, // Include new quantity
              editHistory: asset.editHistory, // Return the updated edit history
          },
      });
  } catch (error) {
      console.error('Error in addQuantityToAsset:', error);
      return res.status(500).json({
          message: 'Server error.',
          error: error.message,
      });
  }
});



  // List all assets
// http://localhost:5050/v1/api/grampanchayat/listAssets
router.get('/listAssets', authenticateGrampanchayat, async (req, res) => {
  try {
      const grampanchayatId = req.user._id;
      // Fetch all assets and populate any necessary fields
      const assets = await AssetGp.find({ grampanchayatId });

      // Check if no assets are found
      if (assets.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'No assets found.',
          });
      }

      // Respond with the list of assets
      res.status(200).json({
          success: true,
          message: 'Assets fetched successfully.',
          data: assets,
      });
  } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({
          success: false,
          message: 'An error occurred while fetching assets.',
          error: error.message,
      });
  }
});



// Add a new asset
// http://localhost:5050/v1/api//grampanchayat/addInventry
router.post('/addInventry', authenticateGrampanchayat,async (req, res) => {
  const grampanchayatId = req.user._id;
  const { name, category, quantity, description } = req.body;


  try {
    // Check if inventory item already exists
    const existingItem = await InventoryGp.findOne({ name, grampanchayatId });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Inventory item already exists.',
      });
    }

    // Create the new inventory item
    const inventory = new InventoryGp({
      name,
      category, // Save category
      quantity,
      editHistory: [
        {
          quantityAdded: quantity,
          updatedQuantity: quantity,
          description,
          creditOrDebit: 'credit', // Transaction is a debit (decrease in quantity)
          grampanchayatId,

        },
      ],
    });

    await inventory.save();

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully.',
      data: inventory, // Send the entire inventory item in response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding inventory.',
      error: error.message || error,
    });
  }
});





// Update inventory quantity
// http://localhost:5050/v1/api/phed/grampanchayat/updateQuantity
router.put('/inventry/updateQuantity', authenticateGrampanchayat, async (req, res) => {
  const { name, quantityToAdd, description } = req.body;
  const grampanchayatId = req.user._id;

  try {
    if (!name || quantityToAdd === undefined || !description) {
      return res.status(400).json({ success: false, message: 'Name, quantity to add, and description are required.' });
    }

    const inventory = await InventoryGp.findOne({ name, grampanchayatId });
    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    const updatedQuantity = inventory.quantity + quantityToAdd;

    inventory.quantity = updatedQuantity;
    inventory.editHistory.push({
      quantityAdded: quantityToAdd,
      updatedQuantity,
      description,
      creditOrDebit: 'credit',
      grampanchayatId,
    });

    const updatedInventory = await inventory.save();
    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully.',
      data: updatedInventory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating inventory.', error });
  }
});





// Get inventory for a specific Gram Panchayat
// http://localhost:5050/v1/api/phed/inventory/:grampanchayatId
router.get('/inventory/:grampanchayatId',authenticateGrampanchayat, async (req, res) => {
  try {
       const grampanchayatId = req.user._id;

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




module.exports = router;