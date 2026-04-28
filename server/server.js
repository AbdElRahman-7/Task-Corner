require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI is not defined in .env file");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is not defined in .env file");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    const User = require("./models/user.model");
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 0) {
      await User.updateMany({}, { role: "admin" });
      console.log("No admins found — upgraded all users to admin.");
    } else {
      console.log(`Admin users found: ${adminCount}`);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Loaded CLIENT_URL: ${process.env.CLIENT_URL}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  });
