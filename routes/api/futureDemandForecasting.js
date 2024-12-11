const express = require('express');
const Notification = require('../../models/futureDemandForecasting');
const router = express.Router();
const { authenticateGrampanchayat } = require('../../middlewear/auth');

const InventoryGp = require('../../models/Inventry');


// GET http://localhost:3000/v1/api/future-demand-forecasting

router.get('/', authenticateGrampanchayat, async (req, res) => {
  try {

    const notifications = await Notification.find({ grampanchayatId: req.user._id})
      .sort({ createdAt: -1 })
      .populate('inventoryId', 'name'); // Populate inventory name

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// PATCH http://localhost:3000/v1/api/future-demand-forecasting/:notificationId/read

router.patch('/:notificationId/read', async (req, res) => {
    try {
      const { notificationId } = req.params;
  
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );
  
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
  
      res.status(200).json(notification);
    } catch (error) {
      res.status(500).json({ error: 'Error marking notification as read' });
    }
  });



//  GET http://localhost:3000/v1/api/future-demand-forecasting/:notificationId

  router.get('/:notificationId', async (req, res) => {
    try {
      const { notificationId } = req.params;
  
      const notification = await Notification.findById(notificationId).populate(
        'inventoryId',
        'name'
      );
  
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
  
      res.status(200).json(notification);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching notification details' });
    }
  });

  // GET  http://localhost:3000/v1/api/future-demand-forecasting/
  router.post('/', async (req, res) => {
    try {
      const { grampanchayatId, inventoryId, message } = req.body;
  
      // Validation
      if (!grampanchayatId || !inventoryId || !message) {
        return res.status(400).json({ error: 'All fields are required: grampanchayatId, inventoryId, message.' });
      }
  
      // Create new notification
      const notification = await Notification.create({
        grampanchayatId,
        inventoryId,
        message,
      });
  
      res.status(201).json({ message: 'Notification created successfully', notification });
    } catch (error) {
      res.status(500).json({ error: 'Error creating notification', details: error.message });
    }
  });
module.exports = router;
