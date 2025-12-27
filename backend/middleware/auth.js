const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "FALLBACK_SECRET_VOOR_DEV";

module.exports = function (req, res, next) {
  // 1. Get token from header
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // 2. Clean token (remove 'Bearer ' prefix)
    const token = authHeader.replace("Bearer ", "");

    // 3. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Attach user payload to request object
    req.user = decoded;
    next();
  } catch (err) {
    // Keep error logging for debugging purposes, but remove success logs
    console.error("Auth Error:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};
