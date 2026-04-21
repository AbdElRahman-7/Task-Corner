require("dotenv").config();
const app = require("./app");

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
}).catch((error)=>{
    console.log(error);
});