const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes.js");
const boardRoutes = require("./routes/board.routes.js");
const taskRoutes = require("./routes/task.routes.js");
const inviteRoutes = require("./routes/invite.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const listRoutes = require("./routes/list.routes.js");

const app = express();

// ✅ CORS قبل أي حاجة تانية
app.use(cors({
  origin: function (origin, callback) {
    const allowed = (process.env.CLIENT_URL || "")
      .split(",")
      .map(u => u.trim())
      .filter(Boolean);

    // السماح لـ Postman والـ server-to-server requests
    if (!origin) return callback(null, true);

    if (allowed.length === 0 || allowed.includes("*") || allowed.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ Handle preflight لكل الـ routes
app.options("*", cors());

app.use(express.json());

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

// Catch-all for undefined API routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

module.exports = app;