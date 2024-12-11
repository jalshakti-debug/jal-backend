const express = require('express')
const app = express();
require('dotenv').config();
const cors = require('cors')
const cron = require('node-cron');

const Notification = require('./models/futureDemandForecasting');
const InventoryGp = require('./models/Inventry');


app.use(cors());
const port = process.env.PORT || 5060
app.listen(port, (req, res) => {
    console.log("Server is running on port 5050 // 5060");
})
app.get('/', (req, res) => {
    res.send(`Hello World`);
})
app.use(express.json());
app.use(cors());
const dbConn = require('./config/database')
dbConn();
app.use("/v1/api/phed", require('./routes/api/phed'));
app.use("/v1/api/grampanchayat", require('./routes/api/grampanchayat'));
app.use("/v1/api/user", require('./routes/api/user'));
app.use("/v1/api/installed-assets", require('./routes/api/InstalledAsset'));
app.use("/v1/api/financial-overview", require('./routes/api/financialOverview'));
app.use("/v1/api/future-demand-forecasting", require('./routes/api/futureDemandForecasting'));
app.use("/v1/api/file", require('./routes/api/fileuploader'));
app.use('/v1/api/grampanchayat_resource', require('./routes/api/GPResource'));
app.use('/v1/api/payment', require('./routes/api/payment'));


// TO Check Inventory is exits or no If exit then okay otherwise send notification
// cron.schedule('0 * * * *', async () => {
//   console.log('Running inventory check...');

//   try {
//     const lowStockItems = await InventoryGp.find({ quantity: { $lt: 10 } });

//     for (const item of lowStockItems) {
//       const notificationExists = await Notification.findOne({
//         inventoryId: item._id,
//         isRead: false,
//       });

//       if (!notificationExists) {
//         const message = `Inventory for ${item.name} is low. Please request restock from PHED.`;

//         await Notification.create({
//           grampanchayatId: item.grampanchayatId,
//           inventoryId: item._id,
//           message,
//         });

//         console.log(`Notification created for ${item.name}`);
//       }
//     }
//   } catch (error) {
//     console.error('Error running inventory check:', error);
//   }
// });
