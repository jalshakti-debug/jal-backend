const express = require('express');
const Receipt = require('../../models/Receipt');
const {authenticateGrampanchayat, authenticateUser, authenticatePhedUser} = require('../../middlewear/auth');

const router = express.Router();

// POST /receipts
// http://localhost:5050/v1/api/receipt
router.post('/', authenticateGrampanchayat,async (req, res) => {
  try {
    const gpId = req.user._id;
    const { typeOfBill, category, amount, description } = req.body;

    // Validate the request body
    if (!typeOfBill || !category || !amount || !description) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Create a new receipt
    const newReceipt = new Receipt({
      gpId,
      typeOfBill,
      category,
      amount,
      description
    });

    // Save the receipt to the database
    await newReceipt.save();

    // Return the newly created receipt
    res.status(201).json(newReceipt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create receipt' });
  }
});

// GET http://localhost:5050/v1/api/receipt/list
// Find receipts by GP ID with populated GP document
router.get('/list', authenticateGrampanchayat, async (req, res) => {
  try {
    const gpId = req.user._id;

    // Find receipts by GP ID with populated GP document
    const receipts = await Receipt.find({ gpId }).populate('gpId');

    // Return the receipts
    res.status(200).json(receipts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to find receipts' });
  }
});


// Get all receipt lists
// http://localhost:5050/v1/api/receipt/all
router.get('/all', async (req, res) => {
  try {
    // Find all receipts
    const receipts = await Receipt.find()
      .populate('gpId')
      .sort({ createdAt: -1 })
      .limit(100);

    // Return the receipts
    res.status(200).json(receipts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to find receipts' });
  }
});

module.exports = router;