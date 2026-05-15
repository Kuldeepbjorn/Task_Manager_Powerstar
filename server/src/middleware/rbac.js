const { ROLE } = require("../models/User");
const { Task } = require("../models/Task");
const { Project } = require("../models/Project");

function isAdmin(req) {
  return req.auth && req.auth.role === ROLE.ADMIN;
}

function refId(value) {
  if (!value) return null;
  if (typeof value === "object" && value._id) {
    return value._id;
  }
  return value;
}

async function assertProjectAccess(userId, role, projectId) {
  if (role === ROLE.ADMIN) return true;
  const id = refId(projectId);
  const project = await Project.findById(id).select("owner members");
  if (!project) return false;
  const uid = userId.toString();
  if (project.owner.toString() === uid) return true;
  return project.members.some((m) => m.toString() === uid);
}

function bodyHasOnlyStatusKeys(body) {
  if (!body || typeof body !== "object") return false;
  const keys = Object.keys(body).filter((k) => body[k] !== undefined);
  return keys.length > 0 && keys.every((k) => k === "status");
}

async function getAccessibleProjectIds(userId, role) {
  if (role === ROLE.ADMIN) return null;
  const list = await Project.find({
    $or: [{ owner: userId }, { members: userId }],
  }).select("_id");
  return list.map((p) => p._id);
}

async function enforceMemberTaskUpdateRules(req, res, next) {
  try {
    if (isAdmin(req)) {
      return next();
    }
    if (req.auth.role !== ROLE.MEMBER) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    if (!bodyHasOnlyStatusKeys(req.body)) {
      return res.status(403).json({
        message: "Members may only change the status of tasks assigned to them",
      });
    }
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.assignee.toString() !== req.auth.userId) {
      return res.status(403).json({
        message: "You may only update status on tasks assigned to you",
      });
    }
    const allowed = await assertProjectAccess(req.auth.userId, req.auth.role, task.project);
    if (!allowed) {
      return res.status(403).json({ message: "No access to this project" });
    }
    return next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  isAdmin,
  assertProjectAccess,
  getAccessibleProjectIds,
  enforceMemberTaskUpdateRules,
};
