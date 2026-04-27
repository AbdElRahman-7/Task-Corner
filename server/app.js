const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes.js");
const boardRoutes = require("./routes/board.routes.js");
const taskRoutes = require("./routes/task.routes.js");
const inviteRoutes = require("./routes/invite.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const listRoutes = require("./routes/list.routes.js");

const app = express();

app.set("trust proxy", 1);

const corsOptions = {
  origin: function (origin, callback) {
    const allowed = (process.env.CLIENT_URL || "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    if (!origin) return callback(null, true);

    if (
      allowed.length === 0 ||
      allowed.includes("*") ||
      allowed.includes(origin)
    ) {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.options("(.*)", cors(corsOptions));

app.use(express.json());


app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(
      `${req.method} ${req.originalUrl} [${res.statusCode}] - ${Date.now() - start}ms`,
    );
  });
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
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${err.message}\n${err.stack}`);
  } else {
    console.error(`[ERROR] ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

module.exports = app;
