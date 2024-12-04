const express = require('express');
const router = express.Router();
const Grampanchayat = require('../../models/Grampanchayat');
const {authenticateGrampanchayat, authenticatePhedUser} = require('../../middlewear/auth');
const bcrypt = require('bcrypt'); // To hash the password
const Asset = require('../../models/Asset');
const Inventory = require('../../models/Inventry');         
const {Complaint,generateComplainNo } = require('../../models/Complaint');
const Notification = require('../../models/Notification');

//http://localhost:5050/v1/api/grampanchayat
router.post('/',authenticatePhedUser, async (req, res) => {
    try {
        const { name, grampanchayatId, address, villageName, password } = req.body;

        // Validate input fields
        if (!name || !grampanchayatId || !address || !villageName || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required (name, grampanchayatId, address, villageName, password)',
            });
        }

        // Create a new Grampanchayat document with the provided data
        const newGrampanchayat = new Grampanchayat({
            name,
            grampanchayatId,
            address,
            villageName,
            password, // The password will be hashed automatically in the schema
        });

        // Save the Grampanchayat
        const savedGrampanchayat = await newGrampanchayat.save();

        // Respond with success
        res.status(201).json({
            success: true,
            message: 'Grampanchayat added successfully!',
            data: savedGrampanchayat,
        });
    } catch (error) {
        console.error('Error while adding Grampanchayat:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding Grampanchayat',
        });
    }
});
//http://localhost:5050/v1/api/grampanchayat/list
router.get('/list', async (req, res) => {
    try {
        // Fetch all Grampanchayat records from the database
        const grampanchayats = await Grampanchayat.find().select('-password'); 

        // Check if no Grampanchayats are found
        if (grampanchayats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No Grampanchayats found!',
            });
        }

        // Respond with the Grampanchayats list
        res.status(200).json({
            success: true,
            message: 'Grampanchayats fetched successfully!',
            data: grampanchayats,
        });
    } catch (error) {
        console.error('Error fetching Grampanchayats:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching Grampanchayats.',
            error: error.message,
        });
    }
});


//http://localhost:5050/v1/api/grampanchayat/login
router.post('/login', async (req, res) => {
    const { grampanchayatId, password } = req.body;

    try {
        const grampanchayat = await Grampanchayat.findOne({ grampanchayatId });
        if (!grampanchayat) {
            return res.status(404).json({ success: false, message: 'Grampanchayat not found' });
        }

        // Compare the entered password with the hashed password stored in the database
        const isMatch = await bcrypt.compare(password, grampanchayat.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid password' });
        }

        // Generate a JWT token
        const token = grampanchayat.generateAuthToken(); // This method is defined in your Grampanchayat model

        // Respond with success and the token
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token: token,  // Send the token to the client
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

//http://localhost:5050/v1/api/grampanchayat/details using token
router.post('/details', authenticateGrampanchayat, async (req, res) => {
    try {
        // At this point, req.grampanchayat will be populated by the middleware (authenticateGrampanchayat)
        const grampanchayat = req.grampanchayat;

        // Return the Grampanchayat details
        res.status(200).json({
            success: true,
            message: 'Grampanchayat details fetched successfully',
            data: grampanchayat,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching Grampanchayat details',
            error: error.message,
        });
    }
});


//http://localhost:5050/v1/api/grampanchayat/spend-list
router.get('/spend-list', async (req, res) => {
    try {
        // Aggregation pipeline to calculate the total amount spent for each Grampanchayat
        const pipeline = [
            {
                // $lookup to join Grampanchayat with assets based on grampanchayatId
                $lookup: {
                    from: 'assets',  // Collection name of the assets
                    localField: '_id',  // Field in Grampanchayat to match
                    foreignField: 'grampanchayatId',  // Field in Asset to match
                    as: 'assets'  // Alias to store matched assets
                }
            },
            {
                // $addFields to calculate the totalSpent by summing up the amount_spent in assets
                $addFields: {
                    totalSpent: {
                        $sum: {
                            $map: {
                                input: "$assets",  // Iterate through each asset
                                as: "asset",  // Alias for each asset
                                in: "$$asset.amount_spent"  // Extract the amount_spent from each asset
                            }
                        }
                    }
                }
            },
            {
                // Optionally add a field for the number of assets
                $addFields: {
                    numberOfAssets: { $size: "$assets" }  // Count the number of assets
                }
            },
            {
                // Project the fields to return in the final response (optional)
                $project: {
                    _id: 1,  // Include the Grampanchayat's _id
                    name: 1,  // Grampanchayat's name field
                    totalSpent: 1,  // Total money spent
                    numberOfAssets: 1  // Number of assets
                }
            }
        ];

        // Execute the aggregation pipeline
        const grampanchayats = await Grampanchayat.aggregate(pipeline);

        // If no Grampanchayats are found, return a 404 error
        if (grampanchayats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No Grampanchayats found!',
            });
        }

        // Return the response with calculated totalSpent
        res.status(200).json({
            success: true,
            message: 'Grampanchayats fetched successfully!',
            data: grampanchayats,
        });
    } catch (error) {
        console.error('Error fetching Grampanchayats:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching Grampanchayats.',
            error: error.message,
        });
    }
});

//http://localhost:5050/v1/api/grampanchayat/inventory/spend-list
router.get('/inventory/spend-list', async (req, res) => {
    try {
        // Aggregation pipeline to calculate the total amount spent for each grampanchayatId
        const pipeline = [
            {
                // $lookup to join Grampanchayat with inventory based on grampanchayatId
                $lookup: {
                    from: 'grampanchayats',  // Collection name of Grampanchayats
                    localField: 'grampanchayatId',  // Field in Inventory to match
                    foreignField: '_id',  // Field in Grampanchayat to match
                    as: 'grampanchayatDetails'  // Alias to store matched Grampanchayat
                }
            },
            {
                // Flatten the array of grampanchayatDetails (since $lookup returns an array)
                $unwind: {
                    path: '$grampanchayatDetails',
                    preserveNullAndEmptyArrays: true,  // Keep inventory even if no Grampanchayat match
                }
            },
            {
                // $addFields to calculate total spend from amount_spent directly
                $addFields: {
                    totalSpend: "$amount_spent"  // Use the amount_spent directly
                }
            },
            {
                // Optionally add a field for the number of inventory items
                $addFields: {
                    numberOfItems: {
                        $add: [
                            { $cond: [{ $gt: [{ $size: "$chemical" }, 0] }, 1, 0] },
                            { $cond: [{ $gt: [{ $size: "$filter" }, 0] }, 1, 0] },
                            { $cond: [{ $gt: [{ $size: "$spareParts" }, 0] }, 1, 0] }
                        ]
                    }
                }
            },
            {
                // Group by grampanchayatId and calculate the sum of totalSpend
                $group: {
                    _id: "$grampanchayatId",  // Group by grampanchayatId
                    totalSpend: { $sum: "$totalSpend" },  // Sum of totalSpend
                    numberOfItems: { $sum: "$numberOfItems" },  // Sum of numberOfItems
                    grampanchayatName: { $first: "$grampanchayatDetails.name" },  // Get Grampanchayat name
                    grampanchayatVillage: { $first: "$grampanchayatDetails.villageName" },  // Get Grampanchayat village name
                }
            },
            {
                // Project the fields to return in the final response
                $project: {
                    _id: 1,  // Include Grampanchayat ID
                    grampanchayatName: 1,  // Grampanchayat name
                    grampanchayatVillage: 1,  // Grampanchayat village name
                    totalSpend: 1,  // Total money spent
                    numberOfItems: 1,  // Total number of items
                }
            }
        ];

        // Execute the aggregation pipeline to fetch inventory spend data
        const inventories = await Inventory.aggregate(pipeline);

        // If no inventory records are found, return a 404 error
        if (inventories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No inventory records found!',
            });
        }

        // Return the response with calculated totalSpend
        res.status(200).json({
            success: true,
            message: 'Inventory spend data fetched successfully!',
            data: inventories,
        });
    } catch (error) {
        console.error('Error fetching inventory spend data:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the inventory spend data.',
            error: error.message,
        });
    }
});


//http://localhost:5050/v1/api/grampanchayat/id
router.get('/:id', async (req, res) => {
    try {
        // Extract the ID from the route parameter
        const { id } = req.params;

        // Find the Grampanchayat by its MongoDB `_id`
        const grampanchayat = await Grampanchayat.findById(id);

        // Check if the Grampanchayat is not found
        if (!grampanchayat) {
            return res.status(404).json({
                success: false,
                message: `Grampanchayat with ID ${id} not found!`,
            });
        }

        // Return the Grampanchayat data in the response
        res.status(200).json({
            success: true,
            message: `Grampanchayat with ID ${id} found successfully !...`,
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


//http://localhost:5050/v1/api/grampanchayat/id -- update
router.put('/:id', async (req, res) => {
    try {
        // Extract the ID from the route parameter
        const { id } = req.params;

        // Set the updatedAt field to the current timestamp
        req.body.updatedAt = new Date(); // Manually set updatedAt to current date and time

        // Find the Grampanchayat by its MongoDB `_id` and update it
        const updatedGrampanchayat = await Grampanchayat.findByIdAndUpdate(
            id, // Find Grampanchayat by ID
            req.body, // Update the document with the data in the request body
            { new: true } // Return the updated document
        );

        // If Grampanchayat is not found
        if (!updatedGrampanchayat) {
            return res.status(404).json({
                success: false,
                message: `Grampanchayat with ID ${id} not found!`,
            });
        }

        // Return the updated Grampanchayat in the response
        res.status(200).json({
            success: true,
            message: `Grampanchayat with ID ${id} updated successfully!`,
            data: updatedGrampanchayat,
        });
    } catch (error) {
        console.error('Error updating Grampanchayat by ID:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the Grampanchayat.',
            error: error.message,
        });
    }
});

//http://localhost:5050/v1/api/grampanchayat/id -- delete
router.delete('/:id', async (req, res) => {
    try {
        // Extract the ID from the route parameter
        const { id } = req.params;

        // Find the Grampanchayat by ID and delete it
        const deletedGrampanchayat = await Grampanchayat.findByIdAndDelete(id);

        // If Grampanchayat is not found
        if (!deletedGrampanchayat) {
            return res.status(404).json({
                success: false,
                message: `Grampanchayat with ID ${id} not found!`,
            });
        }

        // Return success message
        res.status(200).json({
            success: true,
            message: `Grampanchayat with ID ${id} deleted successfully!`,
        });
    } catch (error) {
        console.error('Error deleting Grampanchayat by ID:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the Grampanchayat.',
            error: error.message,
        });
    }
});


// http://localhost:5050/v1/api/assets -- Super Admin can view all assets
router.get('/assets/list', async (req, res) => {
    try {
        // Fetch all asset records
        const assets = await Asset.find().populate('grampanchayatId', '-password'); // Populate Grampanchayat details

        if (assets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No assets found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Assets fetched successfully',
            data: assets,
        });
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the assets.',
            error: error.message,
        });
    }
});


//http://localhost:5050/v1/api/grampanchayat/asset/add
router.post('/asset/add', authenticateGrampanchayat, async (req, res) => {
    try {
        const { description, amount_spent, receipt } = req.body;

        // Validate input fields
        if (!description || !amount_spent || !receipt) {
            return res.status(400).json({
                success: false,
                message: 'All fields (description, amount_spent, receipt) are required.',
            });
        }

        // Create a new asset record for the Grampanchayat
        const newAsset = new Asset({
            grampanchayatId: req.grampanchayat._id,  // Grampanchayat reference from the auth middleware
            description,
            amount_spent,
            receipt,
        });

        // Save the asset record
        const savedAsset = await newAsset.save();

        res.status(201).json({
            success: true,
            message: 'Asset record added successfully!',
            data: savedAsset,
        });
    } catch (error) {
        console.error('Error adding asset record:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding the asset record.',
            error: error.message,
        });
    }
});

//http://localhost:5050/v1/api/asset/grampanchayatId
router.get('/assets/:grampanchayatId', async (req, res) => {
    try {
        // Extract the Grampanchayat ID from the route parameter
        const { grampanchayatId } = req.params;

        // Fetch assets associated with the specific Grampanchayat ID
        const assets = await Asset.find({ grampanchayatId })
            .populate('grampanchayatId', '-password'); // Exclude password field when populating Grampanchayat

        if (assets.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No assets found for Grampanchayat ID: ${grampanchayatId}`,
            });
        }

        // Return the assets associated with the Grampanchayat
        res.status(200).json({
            success: true,
            message: 'Assets fetched successfully',
            data: assets,
        });
    } catch (error) {
        console.error('Error fetching assets for Grampanchayat:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the assets.',
            error: error.message,
        });
    }
});

// inventry http://localhost:5050/v1/api/grampanchayat/inventory/add
router.post('/inventory/add', authenticateGrampanchayat, async (req, res) => {
    try {
        const { category, selectedOption, amountSpent, receipt } = req.body;

        // Validate input fields
        if (!category || !selectedOption || !amountSpent || !receipt) {
            return res.status(400).json({
                success: false,
                message: 'All fields (category, selectedOption, amountSpent, receipt) are required.',
            });
        }

        // Prepare the data to save in the Inventory model
        let inventoryData = {
            grampanchayatId: req.grampanchayat._id,  // Use the authenticated Grampanchayat ID
            amount_spent: amountSpent,
            receipt: receipt,
        };

        // Dynamically add the selected option to the corresponding category
        if (category === 'chemical') {
            inventoryData.chemical = [selectedOption];
        } else if (category === 'filter') {
            inventoryData.filter = [selectedOption];
        } else if (category === 'spareParts') {
            inventoryData.spareParts = [selectedOption];
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid category selected.',
            });
        }

        // Create a new inventory record
        const newInventory = new Inventory(inventoryData);

        // Save the inventory record to the database
        const savedInventory = await newInventory.save();

        // Send a success response
        res.status(201).json({
            success: true,
            message: 'Inventory record added successfully!',
            data: savedInventory,
        });
    } catch (error) {
        console.error('Error adding inventory record:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding the inventory record.',
            error: error.message,
        });
    }
});
//http://localhost:5050/v1/api/grampanchayat/inventory/list
router.get('/inventory/list', authenticateGrampanchayat, async (req, res) => {
    try {
        // Aggregation pipeline to list all inventory with Grampanchayat details
        const pipeline = [
            {
                // $lookup to join Grampanchayat with inventory based on grampanchayatId
                $lookup: {
                    from: 'grampanchayats',  // Collection name of Grampanchayats
                    localField: 'grampanchayatId',  // Field in Inventory to match
                    foreignField: '_id',  // Field in Grampanchayat to match
                    as: 'grampanchayatDetails',  // Alias for the Grampanchayat data
                }
            },
            {
                // Flatten the array of grampanchayatDetails (since $lookup returns an array)
                $unwind: {
                    path: '$grampanchayatDetails',
                    preserveNullAndEmptyArrays: true,  // Keep inventory even if no Grampanchayat match
                }
            },
            {
                // Optionally, you can project the fields you want to return in the response
                $project: {
                    _id: 1,  // Include the inventory ID
                    chemical: 1,
                    filter: 1,
                    spareParts: 1,
                    amount_spent: 1,
                    receipt: 1,
                    grampanchayatId: 1,
                    grampanchayatName: '$grampanchayatDetails.name',  // Add Grampanchayat name
                    grampanchayatVillage: '$grampanchayatDetails.villageName',  // Add Grampanchayat village
                    createdAt: 1
                }
            }
        ];

        // Execute the aggregation pipeline
        const inventories = await Inventory.aggregate(pipeline);

        // If no inventories are found, return a 404 error
        if (inventories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No inventory records found!',
            });
        }

        // Return the response with inventory and grampanchayat details
        res.status(200).json({
            success: true,
            message: 'Inventory records fetched successfully!',
            data: inventories,
        });
    } catch (error) {
        console.error('Error fetching inventory records:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching inventory records.',
            error: error.message,
        });
    }
});
//http://localhost:5050/v1/api/grampanchayat/inventory/673d803cf7d1e6700d0f1e27
router.get('/inventory/:grampanchayatId', async (req, res) => {
    try {
        // Extract the Grampanchayat ID from the route parameter
        const { grampanchayatId } = req.params;

        // Fetch inventory associated with the specific Grampanchayat ID
        const inventory = await Inventory.find({ grampanchayatId })
            .populate('grampanchayatId', '-password'); // Exclude password field when populating Grampanchayat

        // Check if no inventory is found
        if (inventory.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No inventory found for Grampanchayat ID: ${grampanchayatId}`,
            });
        }

        // Return the inventory associated with the Grampanchayat
        res.status(200).json({
            success: true,
            message: 'Inventory fetched successfully',
            data: inventory,
        });
    } catch (error) {
        console.error('Error fetching inventory for Grampanchayat:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the inventory records.',
            error: error.message,
        });
    }
});

// complain api http://localhost:5050/v1/api/grampanchayat/complain
router.post('/complaint/add', authenticateGrampanchayat, async (req, res) => {
    try {
        // Extract relevant fields from the request body
        const { description, purpose } = req.body;

        // Validate input fields
        if (!description || !purpose) {
            return res.status(400).json({
                success: false,
                message: 'Description and purpose are required.',
            });
        }

        // Prepare the data to save in the Complaint model
        let complaintData = {
            complainNo: generateComplainNo(), // Generates the complaint number
            description,
            purpose,
            grampanchayatId: req.grampanchayat._id, // Use the authenticated Grampanchayat ID
        };

        // Dynamically handle additional complaint fields, if needed
        // For example, if the complaint has multiple sub-categories, you can dynamically assign those.
        // You can add more conditions if the Complaint model has more categories.

        // Create a new complaint record
        const newComplaint = new Complaint(complaintData);

        // Save the complaint record to the database
        const savedComplaint = await newComplaint.save();

        // Send a success response
        res.status(201).json({
            success: true,
            message: 'Complaint created successfully!',
            data: savedComplaint, // Send the saved complaint data back in the response
        });
    } catch (error) {
        console.error('Error creating complaint:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the complaint.',
            error: error.message,
        });
    }
});

// complain api http://localhost:5050/v1/api/grampanchayat/complain/list
router.get('/complaint/list', authenticateGrampanchayat, async (req, res) => {
    try {
        // Fetch complaints related to the authenticated Grampanchayat
        const complaints = await Complaint.find();

        // If no complaints are found, return a 404 error
        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No complaints found!',
            });
        }

        // Return the complaints data
        res.status(200).json({
            success: true,
            message: 'Complaints fetched successfully!',
            data: complaints,
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching complaints.',
            error: error.message,
        });
    }
});

// Get complaints made by a specific Grampanchayat http://localhost:5050/v1/api/grampanchayat/complaint-gram-id/673da4d543c121a4abff7221
router.get('/complaint-gram-id/:grampanchayatId', authenticateGrampanchayat, async (req, res) => {
    try {
        // Extract Grampanchayat ID from the URL parameters
        const { grampanchayatId } = req.params;

        // Find complaints related to the Grampanchayat ID
        const complaints = await Complaint.find({ grampanchayatId });

        // If no complaints are found, return a 404 error
        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No complaints found for Grampanchayat ID: ${grampanchayatId}`,
            });
        }

        // Return the complaints data
        res.status(200).json({
            success: true,
            message: 'Complaints fetched successfully!',
            data: complaints,
        });
    } catch (error) {
        console.error('Error fetching complaints by Grampanchayat ID:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching complaints.',
            error: error.message,
        });
    }
});
// POST /notification/add complain api http://localhost:5050/v1/api/grampanchayat/notification
router.post('/notification', authenticateGrampanchayat, async (req, res) => {
    try {
        // Extract title and message from the request body
        const { title, message } = req.body;

        // Validate input fields
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required.',
            });
        }

        // Prepare the data to save in the Notification model
        const notificationData = {
            title,
            message,
            grampanchayatId: req.grampanchayat._id, // Use the authenticated Grampanchayat ID
        };

        // Create a new notification record
        const newNotification = new Notification(notificationData);

        // Save the notification record to the database
        const savedNotification = await newNotification.save();

        // Send a success response
        res.status(201).json({
            success: true,
            message: 'Notification created successfully!',
            data: savedNotification, // Send the saved notification data back in the response
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the notification.',
            error: error.message,
        });
    }
});

 // http://localhost:5050/v1/api/grampanchayat/notification/list
router.get('/notification/list', async (req, res) => {
    try {
        // Fetch all notifications from the database
        const notifications = await Notification.find()
            .populate('grampanchayatId', 'name')  // Populating grampanchayatId with the 'name' field (you can customize this)
            .sort({ createdAt: -1 });  // Optionally sort by the creation date (newest first)

        // Check if there are any notifications
        if (notifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No notifications found.',
            });
        }

        // Send the list of notifications in the response
        res.status(200).json({
            success: true,
            message: 'Notifications fetched successfully!',
            data: notifications,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching notifications.',
            error: error.message,
        });
    }
});

// http://localhost:5050/v1/api/grampanchayat/notification/list grampanchayat/:grampanchayatId
router.get('/notification/list/grampanchayat/:grampanchayatId', async (req, res) => {
    try {
        // Get the grampanchayatId from the URL parameter
        const { grampanchayatId } = req.params;

        // Validate if grampanchayatId is provided
        if (!grampanchayatId) {
            return res.status(400).json({
                success: false,
                message: 'Grampanchayat ID is required in the URL.',
            });
        }

        // Fetch notifications based on grampanchayatId
        const notifications = await Notification.find({ grampanchayatId })
            .populate('grampanchayatId', 'name')  // Populating grampanchayatId with the 'name' field
            .sort({ createdAt: -1 });  // Sort by creation date, newest first

        // Check if there are any notifications
        if (notifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No notifications found for this Grampanchayat.',
            });
        }

        // Send the list of notifications in the response
        res.status(200).json({
            success: true,
            message: 'Notifications fetched successfully!',
            data: notifications,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching notifications.',
            error: error.message,
        });
    }
});




module.exports = router;




module.exports = router;
