const express = require('express');
const Razorpay = require('razorpay');
const Payment = require('../../models/payment');
const Bill = require('../../models/Bill'); // Assuming this is the Bill model
const router = express.Router();

// Create Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_a9SMVLbZY43C8M',
    key_secret: 'KHRjIrGeafqMrzceR8ETW943'
});

// Create Payment Order
router.post('/create-order', async (req, res) => {
    const { amount, billId } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid amount'
        });
    }

    try {
        const bill = await Bill.findById(billId);
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        const options = {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`,
            payment_capture: 1,
            "notes": {
                "note_key_1": "Jal shakati",
                "note_key_2": "User pay the bill"
            }
        };

        // Create Razorpay order
        const order = await razorpayInstance.orders.create(options);
        console.log(order);

        // Respond with the order ID
        res.status(200).json({
            success: true,
            message: 'Order created successfully',
            orderId: order.id
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating order'
        });
    }
});

// Verify Payment
router.post('/verify-payment', async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, billId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({
            success: false,
            message: 'Missing payment details'
        });
    }

    try {
        const crypto = require('crypto');
        const generatedSignature = crypto.createHmac('sha256', 'KHRjIrGeafqMrzceR8ETW943')
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid signature verification'
            });
        }

        // Update the bill and store payment details
        const bill = await Bill.findById(billId);
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        bill.paidUnpade = 'paid';
        await bill.save();

        // Store payment details
        const payment = new Payment({
            billId: billId,
            razorpayOrderId,
            razorpayPaymentId,
            amount: bill.amount,
            date: new Date()
        });

        await payment.save();

        res.status(200).json({
            success: true,
            message: 'Payment verified and details stored successfully'
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while verifying payment'
        });
    }
});

module.exports = router;
