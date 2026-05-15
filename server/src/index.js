require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { connectDb } = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");

const app = express();
const port = Number(process.env.PORT) || 5000;

const clientDist = path.join(__dirname, "../../client/dist");
const clientIndex = path.join(clientDist, "index.html");
const hasClientBuild = fs.existsSync(clientIndex);

const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin:
      corsOrigin === "*" || !corsOrigin
        ? true
        : corsOrigin.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

if (hasClientBuild) {
  app.use(
    express.static(clientDist, {
      index: false,
      maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
    })
  );
}

app.use((req, res, next) => {
  if (!hasClientBuild || (req.method !== "GET" && req.method !== "HEAD")) {
    return next();
  }
  if (req.path.startsWith("/api")) {
    return next();
  }
  return res.sendFile(clientIndex);
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "Not found" });
  }
  next();
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

async function main() {
  await connectDb();
  app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on http://0.0.0.0:${port}`);
    if (hasClientBuild) {
      console.log(`Serving client from ${clientDist}`);
    } else {
      console.warn("Client build not found — run `npm run build` at repo root for production UI.");
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
