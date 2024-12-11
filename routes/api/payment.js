// controllers/paymentController.js
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');

// Create Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: 'your_razorpay_key_id',
    key_secret: 'your_razorpay_key_secret'
});

// Create Payment Order
router.post('/create-order', async (req, res) => {
    const { amount } = req.body;  // amount should be in paise (1 INR = 100 paise)

    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid amount'
        });
    }

    try {
        const options = {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`,
            payment_capture: 1
        };

        // Create Razorpay order
        const order = await razorpayInstance.orders.create(options);

        // Save the order in the database
        const payment = new Payment({
            amount,
            razorpayOrderId: order.id
        });

        await payment.save();

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

// Verify Payment Signature
router.post('/verify-payment', exports.verifyPayment = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    const payment = await Payment.findOne({ razorpayOrderId });

    if (!payment) {
        return res.status(400).json({
            success: false,
            message: 'Order not found'
        });
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const crypto = require('crypto');
    const expectedSignature = crypto.createHmac('sha256', 'your_razorpay_key_secret')
                                     .update(body.toString())
                                     .digest('hex');

    if (expectedSignature === razorpaySignature) {
        payment.status = 'completed';
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        await payment.save();

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully'
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'Invalid payment signature'
        });
    }
});