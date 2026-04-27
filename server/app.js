const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes.js");
const boardRoutes = require("./routes/board.routes.js");
const taskRoutes = require("./routes/task.routes.js");
const inviteRoutes = require("./routes/invite.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const listRoutes = require("./routes/list.routes.js");


const app = express();

app.use(express.json());
app.use(cors({ 
  origin: process.env.CLIENT_URL || "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Basic Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/lists", listRoutes);



// Catch-all for undefined API routes to prevent HTML 404s
app.use("/api", (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

module.exports = app;
