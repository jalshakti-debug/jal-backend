const express = require('express');
const router = express.Router();
const FinancialOverview = require('../../models/FinancialOverview');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// 1. Credit Financial Data
router.post('/credit', async (req, res) => {
    try {
        const financialData = new FinancialOverview({ ...req.body, type: 'credit' });
        const savedData = await financialData.save();
        res.status(201).json({ success: true, message: 'Financial data credited successfully.', data: savedData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error crediting financial data.', error: error.message });
    }
});

// 2. Debit Financial Data
router.post('/debit', async (req, res) => {
    try {
        const financialData = new FinancialOverview({ ...req.body, type: 'debit' });
        const savedData = await financialData.save();
        res.status(201).json({ success: true, message: 'Financial data debited successfully.', data: savedData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error debiting financial data.', error: error.message });
    }
});

// 3. Monthly Spent Money (Debits)
router.get('/monthly-spent/:grampanchayatId', async (req, res) => {
    try {
        const { grampanchayatId } = req.params;
        const startDate = new Date(req.query.year, req.query.month - 1, 1);
        const endDate = new Date(req.query.year, req.query.month, 0);

        const spent = await FinancialOverview.aggregate([
            { $match: { grampanchayatId: new ObjectId(grampanchayatId), type: 'debit', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
        ]);

        res.status(200).json({ success: true, message: 'Monthly spent money fetched.', data: spent[0]?.totalSpent || 0 });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error fetching monthly spent money.', error: error.message });
    }
});

// 4. Monthly Got Money (Credits)
router.get('/monthly-got/:grampanchayatId', async (req, res) => {
    try {
        const { grampanchayatId } = req.params;
        const startDate = new Date(req.query.year, req.query.month - 1, 1);
        const endDate = new Date(req.query.year, req.query.month, 0);

        const received = await FinancialOverview.aggregate([
            { $match: { grampanchayatId: new ObjectId(grampanchayatId), type: 'credit', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, totalReceived: { $sum: '$amount' } } }
        ]);

        res.status(200).json({ success: true, message: 'Monthly got money fetched.', data: received[0]?.totalReceived || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching monthly got money.', error: error.message });
    }
});

// 5. Net Money Received (All Credits)
router.get('/net-received/:grampanchayatId', async (req, res) => {
    try {
        const { grampanchayatId } = req.params;

        const received = await FinancialOverview.aggregate([
            { $match: { grampanchayatId: new  ObjectId(grampanchayatId), type: 'credit' } },
            { $group: { _id: null, totalReceived: { $sum: '$amount' } } }
        ]);

        res.status(200).json({ success: true, message: 'Net money received fetched.', data: received[0]?.totalReceived || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching net received money.', error: error.message });
    }
});

// 6. Net Money Used (All Debits)
router.get('/net-used/:grampanchayatId', async (req, res) => {
    try {
        const { grampanchayatId } = req.params;

        const used = await FinancialOverview.aggregate([
            { $match: { grampanchayatId: new ObjectId(grampanchayatId), type: 'debit' } },
            { $group: { _id: null, totalUsed: { $sum: '$amount' } } }
        ]);

        res.status(200).json({ success: true, message: 'Net money used fetched.', data: used[0]?.totalUsed || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching net used money.', error: error.message });
    }
});

// 7. Update Financial Data
router.put('/:id', async (req, res) => {
    try {
        const updatedData = await FinancialOverview.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedData) {
            return res.status(404).json({ success: false, message: 'Financial data not found.' });
        }
        res.status(200).json({ success: true, message: 'Financial data updated successfully.', data: updatedData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating financial data.', error: error.message });
    }
});

// 8. Delete Financial Data
router.delete('/:id', async (req, res) => {
    try {
        const deletedData = await FinancialOverview.findByIdAndDelete(req.params.id);
        if (!deletedData) {
            return res.status(404).json({ success: false, message: 'Financial data not found.' });
        }
        res.status(200).json({ success: true, message: 'Financial data deleted successfully.', data: deletedData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting financial data.', error: error.message });
    }
});

// 9. Get Single Financial Data
router.get('/:id', async (req, res) => {
    try {
        const financialData = await FinancialOverview.findById(req.params.id);
        if (!financialData) {
            return res.status(404).json({ success: false, message: 'Financial data not found.' });
        }
        res.status(200).json({ success: true, message: 'Financial data fetched successfully.', data: financialData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching financial data.', error: error.message });
    }
});

// 9. Get All Financial Data for Grampaanchayat
router.get('/grampaanchayat/:grampanchayatId', async (req, res) => {
    try {
        // Extract Grampanchayat ID from the URL parameters
        const { grampanchayatId } = req.params;
        const financialData = await FinancialOverview.find({grampanchayatId});
        if (!financialData) {
            return res.status(400).json({ success: false, message: 'Financial data not found.' });
        }
        res.status(200).json({ success: true, message: 'Financial data fetched successfully.', data: financialData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching financial data.', error: error.message });
    }
});


module.exports = router;

