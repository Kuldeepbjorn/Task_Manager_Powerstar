const express = require("express");
const mongoose = require("mongoose");
const { Project } = require("../models/Project");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { ROLE } = require("../models/User");
const { assertProjectAccess } = require("../middleware/rbac");

const router = express.Router();

const projectPopulate = [
  { path: "owner", select: "name email role" },
  { path: "members", select: "name email role" },
];

router.use(authenticate);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get("/", async (req, res, next) => {
  try {
    if (req.auth.role === ROLE.ADMIN) {
      const projects = await Project.find()
        .populate(projectPopulate)
        .sort({ updatedAt: -1 });
      return res.json(projects);
    }
    const projects = await Project.find({
      $or: [{ owner: req.auth.userId }, { members: req.auth.userId }],
    })
      .populate(projectPopulate)
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    const project = await Project.findById(id).populate(projectPopulate);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (req.auth.role !== ROLE.ADMIN) {
      const ok = await assertProjectAccess(req.auth.userId, req.auth.role, project._id);
      if (!ok) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { name, description, owner, members } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }
    const ownerId = owner || req.auth.userId;
    const project = await Project.create({
      name,
      description,
      owner: ownerId,
      members: Array.isArray(members) ? members : [],
    });
    const populated = await Project.findById(project._id).populate(projectPopulate);
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    const { name, description, owner, members } = req.body || {};
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (owner !== undefined) project.owner = owner;
    if (members !== undefined) {
      if (!Array.isArray(members)) {
        return res.status(400).json({ message: "members must be an array of user ids" });
      }
      project.members = members;
    }
    await project.save();
    const populated = await Project.findById(project._id).populate(projectPopulate);
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
