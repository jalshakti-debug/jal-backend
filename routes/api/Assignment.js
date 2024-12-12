const express = require('express');
const router = express.Router();
const Assignment = require('../../models/Assignment');
const Vendor = require('../../models/Vendor');
const Grampanchayat = require('../../models/Grampanchayat');


// Create a new assignment
router.post('/s', async (req, res) => {
  try {
    const { vendorId, grampanchayatId, assetType, assetQuantity } = req.body;

    // Validate Vendor and Grampanchayat existence
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const grampanchayat = await Grampanchayat.findById(grampanchayatId);
    if (!grampanchayat) {
      return res.status(404).json({ success: false, message: 'Grampanchayat not found' });
    }

    // Create new assignment
    const assignment = new Assignment({
      vendorId,
      grampanchayatId,
      assetType,
      assetQuantity
    });

    await assignment.save();

    return res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.get('/vendors-by-grampanchayat/:grampanchayatId', async (req, res) => {
  try {
    const { grampanchayatId } = req.params;

    // Fetch assignments filtered by Grampanchayat and populate vendor details
    const assignments = await Assignment.find({ grampanchayatId })
      .populate('vendorId', 'name contactNumber email Ven_Id') // Fetch vendor details
      .populate('grampanchayatId', 'name grampanchayatId villageName city district state'); // Fetch Grampanchayat details

    if (!assignments.length) {
      return res.status(404).json({ success: false, message: 'No vendors found for this Grampanchayat' });
    }

    // Extract unique vendors
    const vendors = assignments.map((assignment) => assignment.vendorId);
    const uniqueVendors = Array.from(new Set(vendors.map((vendor) => vendor._id.toString()))).map((id) =>
      vendors.find((vendor) => vendor._id.toString() === id)
    );

    // Response
    return res.status(200).json({
      success: true,
      data: {
        grampanchayat: assignments[0].grampanchayatId,
        vendors: uniqueVendors
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
