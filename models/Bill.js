

const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    consumerId: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: String,
        default: () => {
            const now = new Date();
            return `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
        }
    },
    lastDate: { type: String },
    paidUnpade: {type:String, enum:['paid', 'unpaid'] , default: 'unpaid'},
    gpId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Grampanchayat'
    }
});

module.exports = mongoose.model("Bill", billSchema);