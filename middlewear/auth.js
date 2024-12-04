const jwt = require('jsonwebtoken');
const Grampanchayat = require('../models/Grampanchayat');
const User = require('../models/GramUser');
const PhedUser = require('../models/PhedUser');

const authenticate = (role) => {
  return async (req, res, next) => {
    const token = req.header('x-auth-token'); // Token from request header

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
      // Verify the token using the JWT secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user;
      switch (role) {
        case 'grampanchayat':
          user = await Grampanchayat.findById(decoded.id);
          break;
        case 'user':
          user = await User.findById(decoded.id);
          break;
        case 'phed':
          user = await PhedUser.findById(decoded.id);
          break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid role specified.' });
      }

      if (!user) {
        return res.status(404).json({ success: false, message: `${role} not found.` });
      }

      // Attach the authenticated user and role to the request object
      req.user = user;
      req.role = role;

      next(); // Continue to the next middleware or route handler
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(400).json({ success: false, message: 'Invalid or expired token.' });
    }
  };
};

module.exports = {
  authenticateGrampanchayat: authenticate('grampanchayat'),
  authenticateUser: authenticate('user'),
  authenticatePhedUser: authenticate('phed'),
};
