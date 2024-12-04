const jwt = require('jsonwebtoken');

// Function to generate JWT token with user ID and role
const generateToken = (userId, role) => {
  const oneYearInSeconds = 365 * 24 * 60 * 60;  // 1 year in seconds

  return jwt.sign(
    { id: userId, role },  // Payload includes user ID and role
    process.env.JWT_SECRET, // Secret key from environment variables
    { expiresIn: oneYearInSeconds }  // Token expiration time (1 year)
  );
};
module.exports = generateToken;
