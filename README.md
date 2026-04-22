# Bloom Journal

Bloom Journal is a personal English writing practice app. I built it for my own use because I wanted a gentle, consistent way to improve my English, especially my writing. The idea is simple: write a diary entry or answer a daily writing challenge, receive practical feedback, and track progress over time.

The app combines journaling, IELTS-style writing evaluation, grammar correction, recurring error tracking, and a soft visual dashboard designed to make daily practice feel less intimidating.

## Features

- User authentication with JWT.
- Diary mode for free writing.
- Daily challenge mode with a fixed prompt per date.
- AI-powered writing analysis using the OpenAI API.
- Corrected text, grammar explanations, suggestions, and vocabulary upgrades.
- IELTS-style scoring with four criteria:
  - Task Response
  - Coherence & Cohesion
  - Lexical Resource
  - Grammatical Range & Accuracy
- Dashboard with total entries, streak, latest band, average band, and writing trend.
- Weekly and monthly progress chart.
- Calendar view with flowers for saved entries.
- Separate tracking for diary and challenge entries.
- Study plan based on recurring mistakes from the last 30 days.
- Study pages for grammar patterns, with examples from previous corrections.
- Soft pastel UI with floral details.

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Axios
- Recharts
- Lucide React

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcryptjs
- OpenAI API
- dotenv
- CORS

### Deployment

- Vercel-ready frontend
- Vercel-ready backend using serverless functions
- MongoDB Atlas recommended for production

## Project Structure

```text
diary/
  english-diary-backend/
    api/
    src/
      config/
      middleware/
      models/
      routes/
      services/
    server.js
    package.json
    vercel.json

  english-diary-frontend/
    public/
    src/
      assets/
      components/
      contexts/
      hooks/
      lib/
      pages/
    package.json
    vercel.json
```

## Environment Variables

### Backend

Create `english-diary-backend/.env`:

```env
PORT=3000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### Frontend

Create `english-diary-frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Running Locally

Install dependencies in both folders:

```bash
cd english-diary-backend
npm install

cd ../english-diary-frontend
npm install
```

Start the backend:

```bash
cd english-diary-backend
npm run dev
```

Start the frontend:

```bash
cd english-diary-frontend
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

The backend runs on:

```text
http://localhost:3000
```

## Deploying to Vercel

This project is split into two Vercel projects: one for the backend and one for the frontend.

### Backend

Root directory:

```text
english-diary-backend
```

Environment variables:

```env
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=your-secret
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=https://your-frontend-url.vercel.app
```

### Frontend

Root directory:

```text
english-diary-frontend
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Environment variable:

```env
VITE_API_URL=https://your-backend-url.vercel.app
```

## Notes

- The app needs an online MongoDB database for production, such as MongoDB Atlas.
- `localhost` MongoDB works only for local development.
- The AI feedback is intended for practice and learning, not as an official IELTS score.

## Why I Built This

I built Bloom Journal because I wanted to make English writing practice part of my routine. I wanted something personal, calm, and useful: a place where I could write often, notice my repeated mistakes, and slowly build confidence with feedback that feels practical instead of overwhelming.
