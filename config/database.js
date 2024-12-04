const mongoose = require('mongoose');
require('dotenv').config();

const dbConn = () => {
 
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in the environment variables.");
    process.exit(1);  
  }

  mongoose.connect(process.env.DATABASE_URL, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
  .then(() => {
    console.log("DB is connected successfully!");
  })
  .catch((error) => {
    console.error("DB is not connected");
    console.error(error); 
    process.exit(1);  
  });
};

module.exports = dbConn;
