const express = require("express");
const Activity = require("../models/Activity");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      teacher_id,
      teacher_name,
      activity_type,
      created_at,
      subject,
      class: className,
    } = req.body;

    if (
      !teacher_id ||
      !teacher_name ||
      !activity_type ||
      !created_at ||
      !subject ||
      !className
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const createdAtDate = new Date(created_at);
    if (Number.isNaN(createdAtDate.getTime())) {
      return res.status(400).json({ error: "Invalid created_at date" });
    }

    try {
      const activity = await Activity.create({
        teacherId: teacher_id,
        teacherName: teacher_name,
        activityType: activity_type,
        createdAt: createdAtDate,
        subject,
        className,
      });

      return res.status(201).json({
        message: "Activity created",
        activity,
      });
    } catch (err) {
      // Because we have a unique compound index on the activity key,
      // MongoDB will throw a duplicate key error if the same logical activity
      // is inserted twice. We translate that into a clear API response.
      if (err.code === 11000) {
        return res.status(409).json({
          error: "Duplicate activity detected",
          details: "This activity already exists based on its key fields.",
        });
      }

      throw err;
    }
  } catch (err) {
    console.error("Error creating activity", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

