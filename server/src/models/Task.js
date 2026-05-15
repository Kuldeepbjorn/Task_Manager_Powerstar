const mongoose = require("mongoose");

const TASK_STATUS = Object.freeze({
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  BLOCKED: "blocked",
});

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.TODO,
    },
    dueDate: { type: Date, required: true },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = { Task, TASK_STATUS };
