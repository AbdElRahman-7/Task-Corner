const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "default_secret", {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
