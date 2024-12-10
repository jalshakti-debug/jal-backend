const express = require('express');
const file = require('../../helper/file');
const router = express.Router();




const multer = require("multer");
const { randomUUID } = require('crypto');
const storage = multer.memoryStorage();
const fileUpload = multer({ storage: storage }).fields([ { name: "image", maxCount: 10 } ]);

router.post('/upload', fileUpload, async (req, res) => {
    try {
        const uuid = randomUUID();
        const key = await file.uploadFile(req.files[ "image" ][ 0 ], "image", `${uuid}.png`)
        console.log(key);
        //INFO: Store KeY In DB;
        const uploadedImage = await file.fetchFile(key);
        res.status(201).json({
            success: true,
            message: 'File Uploaded.',
            image: uploadedImage
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ success: false, message: 'Error registering user.', error });
    }
});

router.post('/fetch-file', fileUpload, async (req, res) => {
    try {
        const { key } = req.body;
        //INFO: Store KeY In DB;
        const uploadedImage = await file.fetchFile(key);
        res.status(201).json({
            success: true,
            message: 'File Uploaded.',
            image: uploadedImage
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ success: false, message: 'Error registering user.', error });
    }
});

module.exports = router;
