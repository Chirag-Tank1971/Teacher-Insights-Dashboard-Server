# Teacher Insights — Backend

Express + MongoDB backend for the Teacher Insights Dashboard. Provides an HTTP API
to ingest teacher activity records and query summarized and detailed teacher
activity data used by the dashboard client.

## Features

- POST activities with deduplication (unique compound index)
- Teacher summary counts (lessons, quizzes, assessments)
- Weekly activity series per teacher
- Per-teacher subject and class breakdowns

## Requirements

- Node.js 18+ (or compatible)
- MongoDB accessible via a connection URI

## Quick start

1. Install dependencies

```bash
npm install
```

2. Set environment variables (see `Environment`)

3. Run in development

```bash
npm run dev
```

Or run production style:

```bash
npm start
```

The server listens on `PORT` (defaults to `4000`).

## Environment

The server uses `dotenv` and expects these variables (example `.env`):

```env
MONGODB_URI=mongodb+srv://user:password@host/dbname
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000
```

- `MONGODB_URI` (required): MongoDB connection string.
- `PORT` (optional): TCP port for the Express server (default `4000`).
- `ALLOWED_ORIGINS` (optional): comma-separated origins allowed by CORS. Use `*` to allow all.

## API

Base path: `/api`

- Health

	- GET /health
	- Response: `{ status: "ok" }`

- Activities

	- POST `/api/activities`
		- Description: Insert a single activity. The server enforces a unique
			compound index to avoid duplicate logical activities.
		- Body (JSON):

			```json
			{
				"teacher_id": "string",
				"teacher_name": "string",
				"activity_type": "lesson|quiz|assessment",
				"created_at": "ISO timestamp (e.g. 2026-02-13T15:31:51)",
				"subject": "string",
				"class": "string"
			}
			```

		- Success: `201` with created activity document
		- Duplicate: `409` with a clear message

- Teachers

	- GET `/api/teachers/summary`
		- Returns an array of teachers with counts of lessons, quizzes and assessments.

	- GET `/api/teachers/:id/weekly`
		- Returns weekly time-series for the teacher with totals and activity type breakdowns.

	- GET `/api/teachers/:id/details`
		- Returns per-subject and per-class breakdowns and teacher name.

## Data model

The `Activity` model (in `src/models/Activity.js`) stores:

- `teacherId` (string)
- `teacherName` (string)
- `activityType` (enum: `lesson`, `quiz`, `assessment`)
- `createdAt` (Date)
- `subject` (string)
- `className` (string)

There is a unique compound index on
`{ teacherId, activityType, createdAt, subject, className }` to prevent duplicate
logical activities.

<!-- CSV importer instructions removed per request -->
## Examples

- Insert an activity with `curl`:

```bash
curl -X POST http://localhost:4000/api/activities \
	-H "Content-Type: application/json" \
	-d '{"teacher_id":"t123","teacher_name":"Jane Doe","activity_type":"lesson","created_at":"2026-02-13T15:31:51","subject":"Math","class":"Grade 5"}'
```

## Development

- Use `npm run dev` to run with `nodemon`.
- Tests: none included.

## Troubleshooting

- `MONGODB_URI is not set` — make sure your `.env` contains a valid `MONGODB_URI`.
- Duplicate inserts return `409` — this is expected when the importer or client
	tries to insert an already-present logical activity.

## Files of interest

- `src/server.js` — app entry and route mounting
- `src/config/db.js` — MongoDB connection helper
- `src/models/Activity.js` — Mongoose schema and indexes
- `src/routes/activities.js` — POST activity endpoint
- `src/routes/teachers.js` — summary/weekly/details endpoints

