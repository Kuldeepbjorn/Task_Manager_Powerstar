const jwt = require("jsonwebtoken");
const { User, ROLE } = require("../models/User");

function getBearerToken(req) {
  const raw = req.headers.authorization;
  if (!raw || typeof raw !== "string") return null;
  const [scheme, token] = raw.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token.trim();
}

async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.auth = {
      userId: user._id.toString(),
      role: user.role,
      user,
    };
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.auth.role !== ROLE.ADMIN) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

module.exports = { authenticate, requireAdmin, getBearerToken };
