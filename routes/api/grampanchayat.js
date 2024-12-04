const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = require('../../middlewear/token'); 
const Grampanchayat = require('../../models/Grampanchayat');
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




module.exports = router;