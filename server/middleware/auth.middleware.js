const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  let token;

  console.log("Auth Header:", req.headers.authorization);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_secret",
      );

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const admin = (req, res, next) => {
  console.log("[ADMIN CHECK] NODE_ENV:", process.env.NODE_ENV);
  console.log(
    "[ADMIN CHECK] user:",
    req.user?.email,
    "| role:",
    req.user?.role,
  );

  if (
    process.env.NODE_ENV === "development" ||
    (req.user && req.user.role === "admin")
  ) {
    next();
  } else {
    res.status(403).json({
    
      message: "Not authorized as an admin",
      debug: { role: req.user?.role, env: process.env.NODE_ENV }, 
    });
  }
};
module.exports = { protect, admin };
