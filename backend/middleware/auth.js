const jwt = require("jsonwebtoken");
const JWT_SECRET = "RamonDev5"; 

module.exports = function (req, res, next) {
  console.log("--- AUTH MIDDLEWARE START ---");
  
  // 1. Haal token uit header
  const authHeader = req.header("Authorization");
  console.log("1. Received Header:", authHeader);

  if (!authHeader) {
    console.log("ERROR: No Authorization header found");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // 2. Maak token schoon (verwijder 'Bearer ')
    const token = authHeader.replace("Bearer ", "");
    console.log("2. Extracted Token:", token.substring(0, 10) + "..."); // Laat eerste 10 tekens zien

    // 3. Verifieer token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("3. Token Decoded Successfully. UID:", decoded.uid);

    // 4. Zet user in request
    req.user = decoded;
    next();
  } catch (err) {
    console.error("ERROR: Token verification failed:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};