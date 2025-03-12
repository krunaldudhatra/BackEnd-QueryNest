const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

exports.authenticateUser = (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) {
      return res.status(401).json({ error: "Access Denied! No token provided." });
    }

    // Verify JWT token
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = { userId: decoded.userId, loginemail: decoded.email };

    next(); // Proceed to next middleware/controller
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token!" });
  }
};


 
 