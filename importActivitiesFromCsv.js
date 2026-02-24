const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const axios = require("axios");

const API_URL = "http://localhost:4000/api/activities";

// Adjust this path if you move the CSV file
const CSV_PATH = path.resolve(
  "C:\\Users\\chira\\Downloads\\teacher_activities.csv"
);

function normalizeActivityType(type) {
  const t = String(type || "").toLowerCase().trim();

  if (t === "quiz") return "quiz";
  if (t === "lesson plan") return "lesson";
  if (t === "question paper") return "assessment";

  throw new Error(`Unknown Activity_type value: "${type}"`);
}

function toIsoDateString(dateStr) {
  // Input like "2026-02-13 15:31:51" -> "2026-02-13T15:31:51"
  if (!dateStr) {
    throw new Error("Missing Created_at value");
  }

  const trimmed = String(dateStr).trim();

  if (trimmed.includes("T")) {
    return trimmed;
  }

  return trimmed.replace(" ", "T");
}

async function sendRow(row) {
  const body = {
    teacher_id: row.Teacher_id,
    teacher_name: row.Teacher_name,
    activity_type: normalizeActivityType(row.Activity_type),
    created_at: toIsoDateString(row.Created_at),
    subject: row.Subject,
    class: String(row.Grade),
  };

  try {
    const res = await axios.post(API_URL, body, {
      validateStatus: () => true, // handle status codes manually
    });

    if (res.status === 201) {
      return { status: "created" };
    }

    if (res.status === 409) {
      // Duplicate activity based on compound index – safe to ignore
      return { status: "duplicate" };
    }

    console.error(
      `Failed to insert activity for teacher ${body.teacher_id}. Status: ${res.status}, data:`,
      res.data
    );
    return { status: "error" };
  } catch (err) {
    console.error(
      `Request error for teacher ${row.Teacher_id}:`,
      err.message
    );
    return { status: "error" };
  }
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error("CSV file not found at:", CSV_PATH);
    process.exit(1);
  }

  const rows = [];

  console.log("Reading CSV from:", CSV_PATH);

  fs.createReadStream(CSV_PATH)
    .pipe(csvParser())
    .on("data", (row) => {
      rows.push(row);
    })
    .on("end", async () => {
      console.log(`Read ${rows.length} rows from CSV`);

      let created = 0;
      let duplicates = 0;
      let errors = 0;

      for (const row of rows) {
        const result = await sendRow(row);

        if (result.status === "created") created += 1;
        else if (result.status === "duplicate") duplicates += 1;
        else errors += 1;
      }

      console.log("Import complete.");
      console.log("Created:", created);
      console.log("Duplicates (skipped):", duplicates);
      console.log("Errors:", errors);

      process.exit(0);
    })
    .on("error", (err) => {
      console.error("Error reading CSV file:", err);
      process.exit(1);
    });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

