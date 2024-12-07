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
const Announcement = require('../../models/Announcement');
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




// Route to get Grampanchayat details by ObjectId
// http://localhost:5050/v1/api/phed/gp-details/:grampanchayatId
router.get('/gp-details/:grampanchayatId', async (req, res) => {
  try {
      // Extract the grampanchayatId from the route parameter
      const { grampanchayatId } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(grampanchayatId)) {
          return res.status(400).json({
              success: false,
              message: 'Invalid Grampanchayat ID.',
          });
      }

      // Find the Grampanchayat by its ObjectId
      const grampanchayat = await Grampanchayat.findById(grampanchayatId);

      // Check if the Grampanchayat is not found
      if (!grampanchayat) {
          return res.status(404).json({
              success: false,
              message: `Grampanchayat with ID ${grampanchayatId} not found!`,
          });
      }

      // Return the Grampanchayat data in the response
      res.status(200).json({
          success: true,
          message: `Grampanchayat with ID ${grampanchayatId} found successfully!`,
          data: grampanchayat,
      });
  } catch (error) {
      console.error('Error fetching Grampanchayat by ID:', error);
      res.status(500).json({
          success: false,
          message: 'An error occurred while fetching the Grampanchayat.',
          error: error.message,
      });
  }
});


// //---------------------------------------

// // Get assets for a specific Gram Panchayat
// // http://localhost:5050/v1/api/phed/assets/:grampanchayatId
// router.get('/assets/:grampanchayatId', async (req, res) => {
//   try {
//       const { grampanchayatId } = req.params;

//       // Fetch assets for the specified Gram Panchayat
//       const assets = await AssetGp.find({ grampanchayatId });

//       // Check if no assets are found for the specified GP
//       if (assets.length === 0) {
//           return res.status(404).json({
//               success: false,
//               message: `No assets found for Gram Panchayat with ID: ${grampanchayatId}.`,
//           });
//       }

//       // Respond with the list of assets for the specified GP
//       res.status(200).json({
//           success: true,
//           message: 'Assets fetched successfully.',
//           data: assets,
//       });
//   } catch (error) {
//       console.error('Error fetching assets for Gram Panchayat:', error);
//       res.status(500).json({
//           success: false,
//           message: 'An error occurred while fetching assets.',
//           error: error.message,
//       });
//   }
// });



// Add a new asset
//      http://localhost:5050/v1/api/phed/addAsset
router.post('/addAsset', async (req, res) => {
  try {
    const { name, quantity, description, date } = req.body;

    // Validate required fields
    if (!name || !quantity || !description || !date) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check for an existing asset
    const existingAsset = await AssetPhed.findOne({ name });
    if (existingAsset) {
      return res.status(400).json({ message: 'Asset already exists.' });
    }

    // Create and save the new asset with initial history
    const newAsset = new AssetPhed({
      name,
      quantity,
      editHistory: [
        {
          date: new Date(date), // Use the provided date or default to current
          quantityAdded: quantity,
          updatedQuantity: quantity,
          description: description,
          creditOrDebit: 'credit',
        },
      ],
    });
    await newAsset.save();

    // Respond with success
    return res.status(201).json({
      message: 'Asset added successfully, including initial history.',
      asset: newAsset,
    });
  } catch (error) {
    // Log the error and return a server error response
    console.error('Error during asset addition:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
});


// Add quantity to an existing asset
// http://localhost:5050/v1/api/phed/addQuantity
router.put('/addQuantity', async (req, res) => {
  try {
    const { name, quantityToAdd, description } = req.body;

    if (!name || quantityToAdd === undefined) {
      return res.status(400).json({ message: 'Asset name and quantity to add are required.' });
    }

    if (!description) {
      return res
        .status(400)
        .json({ message: 'Description is required when adding or editing quantity.' });
    }

    // Use case-insensitive query
    const asset = await AssetPhed.findOne({ name: new RegExp(`^${name}$`, 'i') });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    console.log('Asset found:', asset);

    // Update quantity and add to history
    asset.quantity += quantityToAdd;
    asset.editHistory.push({
      quantityAdded: quantityToAdd,
      updatedQuantity: asset.quantity,
      description, // Add description to edit history
      creditOrDebit: 'credit',
    });

    await asset.save();

    // Return updated asset with edit history
    return res.status(200).json({
      message: 'Quantity added successfully.',
      asset,
    });
  } catch (error) {
    console.error('Error in addQuantityToAssetPhed:', error);
    return res.status(500).json({
      message: 'Server error.',
      error: error.message,
    });
  }
});

// API to list all assets and populate gramPanchayatId with selected fields
// http://localhost:5050/v1/api/phed/listAssets
router.get('/listAssets', async (req, res) => {
  try {
    // Fetch all assets and populate gramPanchayatId with specific fields
    const assets = await AssetPhed.find()
      .populate({
        path: 'editHistory.gramPanchayatId',
        select: 'villageName city district state pincode', // Select only the desired fields
      });

    // Respond with all assets, including populated editHistory
    return res.status(200).json({ assets });
  } catch (error) {
    console.error('Error in listAssetsPhed:', error);
    return res.status(500).json({
      message: 'Server error.',
      error: error.message,
    });
  }
});

//---------------------------------------

// Add a new asset
// http://localhost:5050/v1/api/phed/addInventry
router.post('/addInventry', async (req, res) => {
  const { name, category, quantity, description } = req.body;

  try {
    // Check if inventory item already exists
    const existingItem = await InventoryPhed.findOne({ name });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Inventory item already exists.',
      });
    }

    // Create the new inventory item
    const inventory = new InventoryPhed({
      name,
      category, // Save category
      quantity,
      editHistory: [
        {
          quantityAdded: quantity,
          updatedQuantity: quantity,
          description,
          creditOrDebit: 'credit', // Transaction is a debit (decrease in quantity)

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
// http://localhost:5050/v1/api/phed/inventry/updateQuantity
router.put('/inventry/updateQuantity', async (req, res) => {
  const { name, quantityToAdd, description } = req.body;

  try {
    if (!name || quantityToAdd === undefined || !description) {
      return res.status(400).json({ success: false, message: 'Name, quantity to add, and description are required.' });
    }

    const inventory = await InventoryPhed.findOne({ name });
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


//  inventory list
// http://localhost:5050/v1/api/phed/inventry/list
// search -- > ?category=chemical
router.get('/inventry/list', async (req, res) => {
  const { category } = req.query;

  try {
    // Build the query based on the presence of category
    const query = category ? { category } : {};

    // Fetch inventory items based on the query
    const inventoryItems = await InventoryPhed.find(query)
    .populate({
      path: 'editHistory.gramPanchayatId',
      select: 'villageName city district state pincode', // Select only the desired fields
    });

    // Check if any items exist
    if (inventoryItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: category
          ? `No inventory items found in the category: ${category}.`
          : 'No inventory items found.',
      });
    }

    res.status(200).json({
      success: true,
      message: category
        ? `Inventory items in category: ${category} retrieved successfully.`
        : 'All inventory items retrieved successfully.',
      data: inventoryItems,
    });
  } catch (error) {
    console.error('Error retrieving inventory items:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving inventory items.',
      error: error.message || error,
    });
  }
});

// API to give asset to Gram Panchayat by ID
// http://localhost:5050/v1/api/phed/asset/give-to-gram/:gramPanchayatId
router.post('/asset/give-to-gram/:gramPanchayatId', async (req, res) => {
  const { gramPanchayatId } = req.params;
  const { assetName, quantity, description, date  } = req.body;

  try {
    // Validate input
    if (!assetName || !quantity || !description || !date) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Find the asset by name
    const asset = await AssetPhed.findOne({ name: assetName });
    console.log(asset)
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // Check available quantity
    if (asset.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity. Available: ${asset.quantity}, Requested: ${quantity}`,
      });
    }

    // Find the Gram Panchayat
    const gramPanchayat = await Grampanchayat.findById(gramPanchayatId);
    if (!gramPanchayat) {
      return res.status(404).json({ success: false, message: 'Gram Panchayat not found.' });
    }

    // Deduct from AssetPhed quantity
    asset.quantity -= quantity;
    asset.editHistory.push({
      date: new Date(),
      quantityAdded: -quantity,
      updatedQuantity: asset.quantity,
      description,
      creditOrDebit: 'debit',
      gramPanchayatId: gramPanchayat._id,
    });
    await asset.save();

    // Find or create the AssetGp entry
    let assetGP = await AssetGp.findOne({ name: assetName, grampanchayatId: gramPanchayatId });
    if (!assetGP) {
      // Create new AssetGp record
      assetGP = new AssetGp({
        name: assetName,
        grampanchayatId: gramPanchayat._id,
        quantity: quantity,
        editHistory: [
          {
            date: new Date(),
            quantityAdded: quantity,
            updatedQuantity: quantity,
            description: description || 'N/A',
            creditOrDebit: 'credit',
          },
        ],
      });
    } else {
      // Update existing AssetGp record
      const newQuantity = assetGP.quantity + quantity;
      assetGP.editHistory.push({
        date: new Date(),
        quantityAdded: quantity,
        updatedQuantity: newQuantity,
        description: description || 'N/A',
        creditOrDebit: 'credit',
      });
      assetGP.quantity = newQuantity;
    }
    await assetGP.save();

    // Respond with success
    res.status(200).json({
      success: true,
      message: `${quantity} ${assetName} successfully distributed to ${gramPanchayat.name}.`,
      data: { updatedAsset: asset, updatedGpAsset: assetGP },
    });
  } catch (error) {
    console.error('Error during asset distribution:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});


// API to get asset distribution information for a specific Gram Panchayat by ID
// http://localhost:5050/v1/api/phed/get-assets-by-gram/:gramPanchayatId
// http://localhost:5050/v1/api/phed/get-assets-by-gram/674cb0379b6f886bf571f334?search=tap search also 
router.get('/get-assets-by-gram/:gramPanchayatId', async (req, res) => {
  const { gramPanchayatId } = req.params;
  const { search } = req.query; // Optional search query

  try {
    // Validate Gram Panchayat existence
    const gramPanchayat = await Grampanchayat.findById(gramPanchayatId);
    if (!gramPanchayat) {
      return res.status(404).json({ success: false, message: 'Gram Panchayat not found.' });
    }

    // Build query for AssetGp
    let query = { grampanchayatId: gramPanchayatId };
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Filter by asset name
    }

    // Fetch assets allocated to this Gram Panchayat
    const assets = await AssetGp.find(query);

    if (!assets.length) {
      return res.status(404).json({ success: false, message: 'No assets found for this Gram Panchayat.' });
    }

    // Format the response with asset details and history
    const assetDetails = assets.map(asset => ({
      assetName: asset.name,
      currentQuantity: asset.quantity,
      editHistory: asset.editHistory.map(entry => ({
        date: entry.date,
        creditOrDebit: entry.creditOrDebit,
        quantityAdded: entry.quantityAdded,
        updatedQuantity: entry.updatedQuantity,
        description: entry.description,
      })),
    }));

    // Respond with Gram Panchayat details and asset history
    res.status(200).json({
      success: true,
      message: 'Assets and history for Gram Panchayat retrieved successfully.',
      data: {
        gramPanchayat: {
          name: gramPanchayat.name,
          villageName: gramPanchayat.villageName,
          city: gramPanchayat.city,
          district: gramPanchayat.district,
          state: gramPanchayat.state,
          pincode: gramPanchayat.pincode,
        },
        assets: assetDetails,
      },
    });
  } catch (error) {
    console.error('Error fetching Gram Panchayat assets:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
});


//----------------------------

// API to post inventory distribution information for a specific Gram Panchayat by ID
// http://localhost:5050/v1/api/phed/get-assets-by-gram/:gramPanchayatId
router.post('/inventory/give-to-gram/:gramPanchayatId', async (req, res) => {
  const { gramPanchayatId } = req.params;
  const { inventoryName, quantity, description, date } = req.body;

  try {
      // Validate input
      if (!inventoryName || !quantity || !description || !date) {
          return res.status(400).json({ success: false, message: 'Inventory name, quantity, description, and date are required.' });
      }

      // Find the inventory by name (inventoryName is unique)
      const inventory = await InventoryPhed.findOne({ name: inventoryName });
      if (!inventory) {
          return res.status(404).json({ success: false, message: 'Inventory not found.' });
      }

      // Check if the inventory has sufficient quantity
      if (inventory.quantity < quantity) {
          return res.status(400).json({ success: false, message: `Not enough inventory quantity available. Available: ${inventory.quantity}, Requested: ${quantity}` });
      }

      // Find the Gram Panchayat by _id (gramPanchayatId)
      const gramPanchayat = await Grampanchayat.findById(gramPanchayatId);
      if (!gramPanchayat) {
          return res.status(404).json({ success: false, message: 'Gram Panchayat not found.' });
      }

      // Deduct the inventory quantity (debit operation)
      inventory.quantity -= quantity;

      // Add an entry to the inventory's edit history (decrease in quantity)
      inventory.editHistory.push({
          quantityAdded: -quantity, // Decrease quantity
          updatedQuantity: inventory.quantity, // New updated quantity
          description, // Description of the transaction
          creditOrDebit: 'debit', // Transaction is a debit (decrease in quantity)
          gramPanchayatId: gramPanchayat._id, // Track which Gram Panchayat received the inventory
      });

      // Save the updated inventory document
      await inventory.save();

      // Populate the gramPanchayatId in the editHistory with selected fields
      const updatedInventory = await InventoryPhed.findOne({ name: inventoryName }).populate({
          path: 'editHistory.gramPanchayatId',
          select: 'villageName city district state pincode', // Select the required fields
          strictPopulate: false // Allow population even if gramPanchayatId is in editHistory schema
      });

      // Respond with success
      res.status(200).json({
          success: true,
          message: `${quantity} ${inventoryName} given to ${gramPanchayat.name} successfully.`,
          data: updatedInventory,
      });
  } catch (error) {
      console.error('Error during inventory distribution:', error);
      res.status(500).json({
          success: false,
          message: 'Server error.',
      });
  }
});

// API to get inventory distribution information for a specific Gram Panchayat by ID
// http://localhost:5050/v1/api/phed//inventory/get-inventory-by-gram/:gramPanchayatId
router.get('/inventory/get-inventory-by-gram/:gramPanchayatId', async (req, res) => {
  const { gramPanchayatId } = req.params;
  const { search } = req.query;  // Capture the search query parameter

  try {
      // Find the Gram Panchayat by ID
      const gramPanchayat = await Grampanchayat.findById(gramPanchayatId);
      if (!gramPanchayat) {
          return res.status(404).json({ success: false, message: 'Gram Panchayat not found.' });
      }

      // Build the query object for InventoryPhed based on the presence of 'search' parameter
      let query = { 'editHistory.gramPanchayatId': gramPanchayatId };
      
      if (search) {
          // If 'search' query is provided, filter inventory by name
          query.name = { $regex: search, $options: 'i' };  // Case-insensitive search
      }

      // Find all inventory items that match the query, and populate the gramPanchayatId in editHistory
      const inventories = await InventoryPhed.find(query).populate({
          path: 'editHistory.gramPanchayatId',
          select: 'villageName city district state pincode', // Populate required Gram Panchayat fields
      });

      if (!inventories || inventories.length === 0) {
          return res.status(404).json({ success: false, message: 'No inventory items found for this Gram Panchayat.' });
      }

      // Filter and format the response to only include relevant data for each inventory item
      const inventoryDetails = inventories.map(inventory => {
          // Filter the editHistory to only include the entries related to the current Gram Panchayat
          const filteredEditHistory = inventory.editHistory.filter(entry => 
              entry.gramPanchayatId && entry.gramPanchayatId._id.toString() === gramPanchayatId
          );

          return {
              inventoryName: inventory.name,
              currentQuantity: inventory.quantity,
              // Add the filtered history specific to this Gram Panchayat
              editHistory: filteredEditHistory.map(entry => ({
                  date: entry.date,
                  quantityAdded: entry.quantityAdded,
                  updatedQuantity: entry.updatedQuantity,
                  description: entry.description,
                  gramPanchayatId: entry.gramPanchayatId, // Include gramPanchayatId to ensure it’s populated
              })),
          };
      });

      // Respond with the inventory distribution data
      res.status(200).json({
          success: true,
          message: 'Inventory distribution for Gram Panchayat retrieved successfully.',
          data: {
              gramPanchayat: {
                  name: gramPanchayat.name,
                  villageName: gramPanchayat.villageName,
                  city: gramPanchayat.city,
                  district: gramPanchayat.district,
                  state: gramPanchayat.state,
                  pincode: gramPanchayat.pincode,
              },
              inventories: inventoryDetails,
          }
      });

  } catch (error) {
      console.error('Error fetching inventory distribution for Gram Panchayat:', error);
      res.status(500).json({
          success: false,
          message: 'Server error.',
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


// POST API to send an announcement to a specific Grampanchayat by _id (from params)
//http://localhost:5050/v1/api/phed/announcements/67540400abcf60aeba862bf1
router.post('/announcements/:receiver', async (req, res) => {
  try {
    const { receiver } = req.params; // Get receiver (Grampanchayat _id) from URL params
    const { message } = req.body; // Get message from the request body

    // Validate request data
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Validate the receiver (Grampanchayat) ID format
    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({ error: 'Invalid Grampanchayat ID format' });
    }

    // Check if Grampanchayat with the provided _id exists
    const grampanchayat = await Grampanchayat.findById(receiver);
    if (!grampanchayat) {
      return res.status(404).json({ error: 'Grampanchayat not found.' });
    }

    // Create and save the announcement
    const announcement = new Announcement({
      message,
      receiver,
    });

    const savedAnnouncement = await announcement.save();

    res.status(201).json({
      message: 'Announcement sent successfully to Grampanchayat.',
      data: savedAnnouncement,
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET API to fetch all announcements for a specific Grampanchayat based on receiver (Grampanchayat _id)
// http://localhost:5050/v1/api/phed/announcements/67540400abcf60aeba862bf1
router.get('/announcements/:receiver', async (req, res) => {
  try {
    const { receiver } = req.params; // Get receiver (Grampanchayat _id) from URL params

    // Validate the receiver ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({ error: 'Invalid Grampanchayat ID.' });
    }

    // Check if Grampanchayat exists with the provided _id
    const grampanchayat = await Grampanchayat.findById(receiver);
    if (!grampanchayat) {
      return res.status(404).json({ error: 'Grampanchayat not found.' });
    }

    // Find all announcements that are associated with the Grampanchayat's _id as receiver
    const announcements = await Announcement.find({ receiver })
    .populate('receiver', 'name grampanchayatId villageName city   mobile');

    // If no announcements are found
    if (announcements.length === 0) {
      return res.status(404).json({ error: 'No announcements found for this Grampanchayat.' });
    }

    // Return the list of announcements
    res.status(200).json({
      message: 'Announcements fetched successfully.',
      data: announcements,
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET API to fetch all announcements
//http://localhost:5050/v1/api/phed/announcements
router.get('/announcements', async (req, res) => {
  try {
    // Fetch all announcements from the database
    const announcements = await Announcement.find()
    .populate('receiver', 'name grampanchayatId villageName city   mobile');

    // If no announcements are found
    if (announcements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No announcements found.',
      });
    }

    // Return the list of announcements with success flag
    res.status(200).json({
      success: true,
      message: 'Announcements fetched successfully.',
      data: announcements,
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
});

module.exports = router;
