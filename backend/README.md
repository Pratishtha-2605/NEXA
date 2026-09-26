# NEXA backend

Express + MongoDB REST API for the CognitiveLab / NEXA frontend (the HTML files in the folder above).

## Run it

```bash
cd backend
npm install
cp .env.example .env      # then paste your MongoDB Atlas link into MONGO_URI
npm run seed              # optional: 5 published demo experiments, one per paradigm
npm start                 # → http://localhost:5000
```

Open `index.html` from the folder above. The pill in the bottom-left corner turns green
("Connected to backend") when the frontend can reach the API. The frontend's URL is set in
`../api.js` (`API_URL`).

## Endpoints

| Method | Path | What it does |
|---|---|---|
| POST | `/api/experiments` | Create a draft (`title`, `paradigm`, `researcherId` required) |
| GET | `/api/experiments?researcherId=` | List experiments (`id`, `title`, `paradigm`, `status`, `trialCount`, `shareSlug`) |
| GET | `/api/experiments/:id` | One experiment, including correct answers |
| PUT | `/api/experiments/:id` | Update a draft (published experiments are locked) |
| PUT | `/api/experiments/:id/publish` | Publish → `{ shareSlug, shareUrl }` |
| GET | `/api/experiments/run/:shareSlug` | Participant view, **without** `correctResponse` |
| POST | `/api/responses` | Save one response or an array; the server sets `isCorrect` |
| GET | `/api/responses/:experimentId` | All responses |
| GET | `/api/responses/:experimentId/stats` | Participants, avg RT, accuracy, per-trial breakdown |
| GET | `/api/responses/:experimentId/export` | CSV download |

Paradigms: `stroop`, `simple-reaction-time`, `go-no-go`, `flanker`, `lexical-decision`.
Trial `type`: `color-word` for Stroop, `text` for the others.

## Response body (one per trial)

```json
{
  "experimentId": "…",
  "participantId": "P-4821",
  "trialId": "…",
  "trialIndex": 1,
  "response": "red",
  "timedOut": false,
  "stimulusOnsetTimestamp": 1727340000123.4,
  "responseTimestamp": 1727340000807.9
}
```

Reaction time = `responseTimestamp − stimulusOnsetTimestamp`, both measured in the browser with
`performance.now()`, so network latency never affects it. `isCorrect` is computed on the server
from the trial's `correctResponse`, because participants never receive the answers.
