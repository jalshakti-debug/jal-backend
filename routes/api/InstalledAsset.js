const express = require('express');
const router = express.Router();
const InstalledAsset = require('../../models/InstalledAsset');
const AssetGp = require('../../models/gpAssets'); // Correct path to gpAssets.js
const { authenticateGrampanchayat } = require('../../middlewear/auth');
const Worker = require('../../models/Worker')
const mongoose = require('mongoose');

// installed asset
// POST  http://localhost:5050/v1/api/installed-assets
router.post('/', async (req, res) => {
    try {

        const newAsset = new InstalledAsset(req.body);
        const savedAsset = await newAsset.save();

        let assetGP = await AssetGp.findOne({ name: req.body.assetsType, grampanchayatId: req.body.grampanchayatId });
        if(assetGP){
            assetGP.name = assetName;
            assetGP.quantity = assetGP.quantity - 1;
            assetGP.editHistory.push({
                date: new Date(),
                quantityAdded: quantityToAdd,
                updatedQuantity: assetGP.quantity,
                description: description || 'N/A',
                creditOrDebit: 'credit',
            });
            if(assetGP.quantity <= 10){
            await Notification.create({
                grampanchayatId: req.body.grampanchayatId,
                inventoryId: assetGP._id,
                message: `${assetGP.name}, inventory is running low. Please replenish it promptly to avoid shortages`,
            });
            }
            await assetGP.save();
        }
        res.status(201).json({
            success: true,
            message: 'Installed asset created successfully.',
            data: savedAsset,
        });
    } catch (error) {
        console.error('Error creating installed asset:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating installed asset.',
            error: error.message,
        });
    }
});


//  put http://localhost:5050/v1/api/installed-assets/:id
// update installed assets
router.put('/:id', async (req, res) => {
    try {
        const updatedAsset = await InstalledAsset.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!updatedAsset) {
            return res.status(404).json({
                success: false,
                message: 'Installed asset not found.',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Installed asset updated successfully.',
            data: updatedAsset,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating installed asset.',
            error: error.message,
        });
    }
});

//  get http://localhost:5050//v1/api/installed-assets/by-grampanchayat/:grampanchayatId

// get by Grampanchayat
router.get('/by-grampanchayat/:grampanchayatId', authenticateGrampanchayat, async (req, res) => {
    try {
        const assets = await InstalledAsset.find({ grampanchayatId: req.user._id }).populate('workerId', 'name mobile jobTitle');
        res.status(200).json({
            success: true,
            message: 'Installed assets fetched successfully.',
            data: assets,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching installed assets.',
            error: error.message,
        });
    }
});

//  get http://localhost:5050/v1/api/installed-assets/:id
// get installed assets package
router.get('/:id', async (req, res) => {
    try {
        const asset = await InstalledAsset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Installed asset not found.',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Installed asset fetched successfully.',
            data: asset,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching installed asset.',
            error: error.message,
        });
    }
});

//  delete http://localhost:5050/v1/api/installed-assets/:id
// delete installed assets
router.delete('/:id', async (req, res) => {
    try {
        const deletedAsset = await InstalledAsset.findByIdAndDelete(req.params.id);
        if (!deletedAsset) {
            return res.status(404).json({
                success: false,
                message: 'Installed asset not found.',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Installed asset deleted successfully.',
            data: deletedAsset,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting installed asset.',
            error: error.message,
        });
    }
});

router.get('/get-assets-installed-by-worker/:workerId', async (req, res) => {
    try {
        const { workerId } = req.params;

        // Validate workerId
        if (!mongoose.Types.ObjectId.isValid(workerId)) {
            return res.status(400).json({ message: 'Invalid worker ID' });
        }

        // Fetch data using aggregation pipeline
        const assets = await InstalledAsset.aggregate([
            {
                $match: { workerId: new mongoose.Types.ObjectId(workerId) }
            },
            {
                $lookup: {
                    from: 'grampanchayats', // Replace with your actual Grampanchayat collection name
                    localField: 'grampanchayatId',
                    foreignField: '_id',
                    as: 'grampanchayatDetails'
                }
            },
            {
                $unwind: {
                    path: '$grampanchayatDetails',
                    preserveNullAndEmptyArrays: true // To include assets without Grampanchayat details
                }
            },
            {
                $project: {
                    _id: 1,
                    assetsType: 1,
                    assetsStatus: 1,
                    latitude: 1,
                    longitude: 1,
                    assetsIdentificationId: 1,
                    status: 1,
                    userId: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'grampanchayatDetails.name': 1,
                    'grampanchayatDetails.location': 1
                }
            }
        ]);

        return res.status(200).json({ success: true, data: assets });
    } catch (error) {
        console.error('Error fetching assets:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});


module.exports = router;

