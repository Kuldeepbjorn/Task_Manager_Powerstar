const mongoose = require("mongoose");

const ROLE = Object.freeze({
  ADMIN: "Admin",
  MEMBER: "Member",
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: [ROLE.ADMIN, ROLE.MEMBER],
      default: ROLE.MEMBER,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User, ROLE };
