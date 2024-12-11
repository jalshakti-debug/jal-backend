const express = require('express');
const Grampanchayat = require('../../models/GPResource');
const router = express.Router();
router.post('/', async (req, res) => {
    try {
        const newGP = new Grampanchayat(req.body);
        const savedGP = await newGP.save();
        res.status(201).json(savedGP);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 2. Get Single Grampanchayat
router.get('/:id', async (req, res) => {
    try {
        const gp = await Grampanchayat.findOne({ GP_id: req.params.id });
        if (!gp) {
            return res.status(404).json({ message: 'Grampanchayat not found' });
        }
        res.json(gp);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Get List of Resources
router.get('/:id/resources', async (req, res) => {
    try {
        const gp = await Grampanchayat.findOne({ GP_id: req.params.id });
        if (!gp) {
            return res.status(404).json({ message: 'Grampanchayat not found' });
        }
        res.json(gp.sources);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Delete Grampanchayat
router.delete('/:id', async (req, res) => {
    try {
        const deletedGP = await Grampanchayat.findOneAndDelete({ GP_id: req.params.id });
        if (!deletedGP) {
            return res.status(404).json({ message: 'Grampanchayat not found' });
        }
        res.json({ message: 'Grampanchayat deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 5. Update Resource
router.put('/:id/resources', async (req, res) => {
    try {
        const { sources } = req.body;
        const updatedGP = await Grampanchayat.findOneAndUpdate(
            { GP_id: req.params.id },
            { $set: { sources } },
            { new: true }
        );
        if (!updatedGP) {
            return res.status(404).json({ message: 'Grampanchayat not found' });
        }
        res.json(updatedGP);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;