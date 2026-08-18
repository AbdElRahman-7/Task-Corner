require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.model");

if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected to MongoDB");

  // This will update ALL existing users to have the "admin" role.
  // If you only want to update a specific user, you can change the {} to { email: "your-email@example.com" }
  const result = await User.updateMany({}, { $set: { role: "admin" } });
  
  console.log(`Successfully updated ${result.modifiedCount} users to Admin!`);
  
  mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
