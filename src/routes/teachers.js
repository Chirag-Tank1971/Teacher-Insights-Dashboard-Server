const express = require("express");
const Activity = require("../models/Activity");

const router = express.Router();

router.get("/summary", async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: {
            teacherId: "$teacherId",
            teacherName: "$teacherName",
            activityType: "$activityType",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: {
            teacherId: "$_id.teacherId",
            teacherName: "$_id.teacherName",
          },
          counts: {
            $push: {
              activityType: "$_id.activityType",
              count: "$count",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          teacher_id: "$_id.teacherId",
          teacher_name: "$_id.teacherName",
          lessons: {
            $let: {
              vars: {
                matches: {
                  $filter: {
                    input: "$counts",
                    as: "c",
                    cond: { $eq: ["$$c.activityType", "lesson"] },
                  },
                },
              },
              in: {
                $ifNull: [{ $arrayElemAt: ["$$matches.count", 0] }, 0],
              },
            },
          },
          quizzes: {
            $let: {
              vars: {
                matches: {
                  $filter: {
                    input: "$counts",
                    as: "c",
                    cond: { $eq: ["$$c.activityType", "quiz"] },
                  },
                },
              },
              in: {
                $ifNull: [{ $arrayElemAt: ["$$matches.count", 0] }, 0],
              },
            },
          },
          assessments: {
            $let: {
              vars: {
                matches: {
                  $filter: {
                    input: "$counts",
                    as: "c",
                    cond: { $eq: ["$$c.activityType", "assessment"] },
                  },
                },
              },
              in: {
                $ifNull: [{ $arrayElemAt: ["$$matches.count", 0] }, 0],
              },
            },
          },
        },
      },
      {
        $sort: { teacher_name: 1 },
      },
    ];

    const summary = await Activity.aggregate(pipeline);

    return res.json({ data: summary });
  } catch (err) {
    console.error("Error fetching teacher summary", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/weekly", async (req, res) => {
  try {
    const teacherId = req.params.id;

    const pipeline = [
      {
        $match: {
          teacherId,
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$createdAt" },
            week: { $isoWeek: "$createdAt" },
          },
          total: { $sum: 1 },
          lessons: {
            $sum: {
              $cond: [{ $eq: ["$activityType", "lesson"] }, 1, 0],
            },
          },
          quizzes: {
            $sum: {
              $cond: [{ $eq: ["$activityType", "quiz"] }, 1, 0],
            },
          },
          assessments: {
            $sum: {
              $cond: [{ $eq: ["$activityType", "assessment"] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.week": 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          week: "$_id.week",
          total: 1,
          lessons: 1,
          quizzes: 1,
          assessments: 1,
        },
      },
    ];

    const weekly = await Activity.aggregate(pipeline);

    return res.json({
      teacher_id: teacherId,
      weeks: weekly,
    });
  } catch (err) {
    console.error("Error fetching weekly activity", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/details", async (req, res) => {
  try {
    const teacherId = req.params.id;

    const subjectPipeline = [
      {
        $match: { teacherId },
      },
      {
        $group: {
          _id: "$subject",
          total: { $sum: 1 },
          lessons: {
            $sum: {
              $cond: [{ $eq: ["$activityType", "lesson"] }, 1, 0],
            },
          },
          quizzes: {
            $sum: {
              $cond: [{ $eq: ["$activityType", "quiz"] }, 1, 0],
            },
          },
          assessments: {
            $sum: {
              $cond: [{ $eq: ["$activityType", "assessment"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          subject: "$_id",
          total: 1,
          lessons: 1,
          quizzes: 1,
          assessments: 1,
        },
      },
      {
        $sort: { subject: 1 },
      },
    ];

    const classPipeline = [
      {
        $match: { teacherId },
      },
      {
        $group: {
          _id: "$className",
          total: { $sum: 1 },
          lessons: {
            $sum: {
              $cond: [{ $eq: ["$activityType", "lesson"] }, 1, 0],
            },
          },
          quizzes: {
            $sum: {
              $cond: [{ $eq: ["$activityType", "quiz"] }, 1, 0],
            },
          },
          assessments: {
            $sum: {
              $cond: [{ $eq: ["$activityType", "assessment"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          class: "$_id",
          total: 1,
          lessons: 1,
          quizzes: 1,
          assessments: 1,
        },
      },
      {
        $sort: { class: 1 },
      },
    ];

    const [subjects, classes] = await Promise.all([
      Activity.aggregate(subjectPipeline),
      Activity.aggregate(classPipeline),
    ]);

    const teacherDoc = await Activity.findOne({ teacherId }).select(
      "teacherName"
    );

    return res.json({
      teacher_id: teacherId,
      teacher_name: teacherDoc ? teacherDoc.teacherName : null,
      subjects,
      classes,
    });
  } catch (err) {
    console.error("Error fetching teacher details", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

