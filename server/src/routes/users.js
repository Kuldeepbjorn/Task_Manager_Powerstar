const express = require("express");
const mongoose = require("mongoose");
const { User, ROLE } = require("../models/User");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { hashPassword } = require("../utils/authTokens");

const router = express.Router();

router.use(authenticate);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    if (req.auth.role !== ROLE.ADMIN && req.auth.userId !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const user = await User.findById(id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const r = role || ROLE.MEMBER;
    if (![ROLE.ADMIN, ROLE.MEMBER].includes(r)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const normalized = String(email).toLowerCase().trim();
    const passwordHash = await hashPassword(String(password));
    const user = await User.create({
      email: normalized,
      passwordHash,
      name,
      role: r,
    });
    const out = user.toObject();
    delete out.passwordHash;
    res.status(201).json(out);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const isSelf = req.auth.userId === id;
    if (req.auth.role !== ROLE.ADMIN && !isSelf) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const user = await User.findById(id).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { email, name, role, password } = req.body || {};
    if (email) user.email = String(email).toLowerCase().trim();
    if (name !== undefined) user.name = name;
    if (req.auth.role === ROLE.ADMIN && role !== undefined) {
      if (![ROLE.ADMIN, ROLE.MEMBER].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      user.role = role;
    }
    if (password) {
      user.passwordHash = await hashPassword(String(password));
    }
    await user.save();
    const out = user.toObject();
    delete out.passwordHash;
    res.json(out);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
