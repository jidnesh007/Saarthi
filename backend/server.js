/* =====================================================
   Saarthi Backend - FINAL CLEAN VERSION
   ===================================================== */

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const User = require("./models/User");

dotenv.config();
const app = express();

/* =====================================================
   CORS CONFIG (Correct + Secure)
   ===================================================== */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

/* =====================================================
   Middleware
   ===================================================== */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =====================================================
   JWT Middleware
   ===================================================== */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* =====================================================
   Database Connection
   ===================================================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

/* =====================================================
   ROUTES (CLEAN + NO DUPLICATES)
   ===================================================== */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));

app.use("/api/journey", require("./routes/journeyRoutes"));

/* =====================================================
   Protected Route Example
   ===================================================== */
app.get("/api/profile/me", authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

/* =====================================================
   GLOBAL ERROR HANDLER
   ===================================================== */
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.message);
  res.status(500).json({ message: err.message });
});

/* =====================================================
   START SERVER
   ===================================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
