require("dotenv").config();
const app = require("./app");

const mongoose = require("mongoose");

if (!process.env.MONGO_URI) {
    console.error("ERROR: MONGO_URI is not defined in .env file");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
}).catch((error)=>{
    console.error("MongoDB Connection Error:", error);
});