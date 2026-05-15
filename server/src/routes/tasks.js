const express = require("express");
const mongoose = require("mongoose");
const { Task } = require("../models/Task");
const { ROLE } = require("../models/User");
const { authenticate, requireAdmin } = require("../middleware/auth");
const {
  assertProjectAccess,
  getAccessibleProjectIds,
  enforceMemberTaskUpdateRules,
} = require("../middleware/rbac");

const router = express.Router();

const taskPopulate = [
  {
    path: "project",
    populate: [
      { path: "owner", select: "name email role" },
      { path: "members", select: "name email role" },
    ],
  },
  { path: "assignee", select: "name email role" },
];

router.use(authenticate);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function memberCanViewTask(userId, role, task) {
  if (role === ROLE.ADMIN) return true;
  const assigneeRef = task.assignee && task.assignee._id != null ? task.assignee._id : task.assignee;
  if (String(assigneeRef) === userId) return true;
  return assertProjectAccess(userId, role, task.project);
}

router.get("/", async (req, res, next) => {
  try {
    if (req.auth.role === ROLE.ADMIN) {
      const tasks = await Task.find().populate(taskPopulate).sort({ dueDate: 1 });
      return res.json(tasks);
    }
    const projectIds = await getAccessibleProjectIds(req.auth.userId, req.auth.role);
    const filter =
      projectIds.length === 0
        ? { assignee: req.auth.userId }
        : {
            $or: [{ assignee: req.auth.userId }, { project: { $in: projectIds } }],
          };
    const tasks = await Task.find(filter).populate(taskPopulate).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    const task = await Task.findById(id).populate(taskPopulate);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const ok = await memberCanViewTask(req.auth.userId, req.auth.role, task);
    if (!ok) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { title, description, status, dueDate, project, assignee } = req.body || {};
    if (!title || !dueDate || !project || !assignee) {
      return res.status(400).json({
        message: "title, dueDate, project, and assignee are required",
      });
    }
    const task = await Task.create({
      title,
      description,
      status,
      dueDate,
      project,
      assignee,
    });
    const populated = await Task.findById(task._id).populate(taskPopulate);
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", enforceMemberTaskUpdateRules, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.auth.role === ROLE.ADMIN) {
      const { title, description, status, dueDate, project, assignee } = req.body || {};
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (project !== undefined) task.project = project;
      if (assignee !== undefined) task.assignee = assignee;
    } else {
      task.status = req.body.status;
    }
    await task.save();
    const populated = await Task.findById(task._id).populate(taskPopulate);
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", enforceMemberTaskUpdateRules, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.auth.role === ROLE.ADMIN) {
      const { title, description, status, dueDate, project, assignee } = req.body || {};
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (project !== undefined) task.project = project;
      if (assignee !== undefined) task.assignee = assignee;
    } else {
      if (req.body.status !== undefined) {
        task.status = req.body.status;
      }
    }
    await task.save();
    const populated = await Task.findById(task._id).populate(taskPopulate);
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
