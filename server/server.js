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

    // TEMPORARY: Automatically upgrade all users to admin so you don't have to run scripts!
    try {
      const User = require('./models/user.model');
      await User.updateMany({}, { role: "admin" });
      console.log("SUCCESS: All users have been upgraded to Admin in the database!");
    } catch (e) {
      console.error("Failed to upgrade users:", e);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Loaded CLIENT_URL: ${process.env.CLIENT_URL}`); // Restarting to apply Express 5 wildcard fix
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  });