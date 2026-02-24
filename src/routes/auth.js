const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function signToken(user) {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    teacherId: user.teacherId || null,
  };

  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(payload, secret, { expiresIn });
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, role, teacherId } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email is already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      role: role || "teacher",
      teacherId: role === "teacher" ? teacherId : undefined,
    });

    const token = signToken(user);

    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId,
      },
      token,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error registering user", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: admin access only" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId,
      },
      token,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error logging in", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

