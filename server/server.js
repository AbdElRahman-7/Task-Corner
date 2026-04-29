require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const User = require("./models/user.model");
const Board = require("./models/board.model");
const List = require("./models/list.model");
const Task = require("./models/task.model");

if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI is not defined in .env file");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is not defined in .env file");
  process.exit(1);
}

// Helper to identify IP for whitelisting
const https = require("https");
https.get("https://api.ipify.org", (res) => {
  res.on("data", (ip) => {
    console.log("---------------------------------------------------------");
    console.log(`YOUR CURRENT PUBLIC IP: ${ip}`);
    console.log("ADD THIS IP TO YOUR MONGODB ATLAS WHITELIST!");
    console.log("---------------------------------------------------------");
  });
});

let isServerStarted = false;

const connectWithRetry = () => {
  console.log("Attempting to connect to MongoDB...");
  
  const options = {
    dbName: "taskcorner",
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 1000,
  };

  mongoose
    .connect(process.env.MONGO_URI, options)
    .then(async () => {
      console.log("Connected to MongoDB successfully");
      
      // Run admin initialization and board migration logic
      try {
        // 1. Ensure at least one admin exists
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount === 0) {
          await User.updateMany({}, { role: "admin" });
          console.log("No admins found — upgraded all users to admin.");
        }

        // 2. Migration: Add default lists to all boards that have none
        console.log("Checking for boards that need default lists...");
        const boards = await Board.find();
        let migratedCount = 0;

        for (const board of boards) {
          const listCount = await List.countDocuments({ boardId: board._id });
          if (listCount === 0) {
            const defaultLists = ["Todo", "In Progress", "Done"];
            await Promise.all(
              defaultLists.map((title, index) => 
                List.create({ title, boardId: board._id, order: index })
              )
            );
            migratedCount++;
          }
        }
        if (migratedCount > 0) {
          console.log(`Successfully migrated ${migratedCount} boards with default lists.`);
        } else {
          console.log("All boards already have lists. No migration needed.");
        }
      } catch (migrationErr) {
        console.error("Migration error:", migrationErr.message);
      }

      if (!isServerStarted) {
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
        });
        isServerStarted = true;
      }
    })
    .catch((error) => {
      console.error("--- MONGODB ERROR DETAILS ---");
      console.error("Message:", error.message);
      if (error.name === "MongooseServerSelectionError") {
        console.error("Type: Network/Firewall Error (The server can't see the database)");
      } else if (error.message.includes("auth")) {
        console.error("Type: Authentication Error (Wrong username or password)");
      }
      console.error("-----------------------------");
      console.log("Retrying in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();
