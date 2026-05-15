const express = require("express");
const { User, ROLE } = require("../models/User");
const { hashPassword, verifyPassword, signToken } = require("../utils/authTokens");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const normalized = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalized });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await hashPassword(String(password));
    const isFirstUser = (await User.countDocuments()) === 0;
    const user = await User.create({
      email: normalized,
      passwordHash,
      name,
      role: isFirstUser ? ROLE.ADMIN : ROLE.MEMBER,
    });
    const token = signToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const normalized = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalized }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = await verifyPassword(String(password), user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
