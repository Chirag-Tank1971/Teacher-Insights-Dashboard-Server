const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    teacherId: {
      type: String,
      required: true,
      index: true,
    },
    teacherName: {
      type: String,
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: ["lesson", "quiz", "assessment"],
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    className: {
      // using className to avoid reserved word issues
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: "activities",
  }
);

// Duplicate handling strategy:
// Enforce a unique compound index on the logical key
// (teacherId + activityType + createdAt + subject + className).
// The POST /api/activities route will catch duplicate key errors
// and respond cleanly instead of crashing.
activitySchema.index(
  {
    teacherId: 1,
    activityType: 1,
    createdAt: 1,
    subject: 1,
    className: 1,
  },
  { unique: true }
);

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;

