const express = require('express')
const app = express();
require('dotenv').config();
const cors = require('cors')
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


