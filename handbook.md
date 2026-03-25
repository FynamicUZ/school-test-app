# School Test App - Developer Handbook

This handbook documents the continuous implementation and setup instructions for the Telegram Mini App & Bot for school tests.

## Stack Overview
- **Backend & Bot:** Python 3, FastAPI, Aiogram 3.x
- **Database:** Neon PostgreSQL (or SQLite locally) via SQLAlchemy
- **Frontend:** HTML, CSS, Vanilla JS via Telegram Web App API
- **Deployment:** Koyeb (Backend/Bot) and Netlify (Frontend)
- **Scoring Logic:** Rasch Model / IRT

## Implementation Log

### Step 1: Database Schema & Environment
- Configured `.env` variables for tokens and database setup.
- Created `backend/database.py` with SQLAlchemy connection config supporting `sqlite` and `postgresql`.
- Created `backend/models.py` defining:
  - `User`: Handles both teachers and students.
  - `Test`: Stores configuration, answer key, timings, and Telegram file ID.
  - `Submission`: Stores student answers and Rasch-calculated person ability score.

### Step 2: FastAPI Backend API Routes
- Created `backend/main.py` with endpoints for Users, Tests, and Submissions.
- Defined Pydantic schemas for data validation.

### Step 3: Aiogram Bot Integration
- Created `backend/bot.py` handling `/start` and document uploads.
- Configured WebApp button linking to the frontend mini app.

### Step 4: Rasch Model Calculation
- Built `backend/rasch.py` using NumPy and JMLE approximation for Rasch model estimation (item difficulty/person ability).

### Step 5: Frontend UI
- Created `frontend/index.html`, `frontend/style.css`, and `frontend/app.js`.
- Styled using native Telegram theme padding variables (`var(--tg-theme-bg-color)` etc.).
### Step 6: Teacher Dashboard UI
- Created `frontend/teacher.html` and `frontend/teacher.js`.
- Added `/tests/{test_id}/rasch` endpoint to the backend for scoring.

### Step 7: Deployment Preparation
- Created `Procfile` for Koyeb (supports web and bot processes).
- Updated `requirements.txt` for production database support.

## Deployment Guide

### Backend & Bot (Koyeb)
1. Link your GitHub repository to Koyeb.
2. Select **Python** as the environment.
3. Add the following **Environment Variables** in Koyeb:
   - `BOT_TOKEN`: Your Telegram Bot Token.
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `WEBAPP_URL`: Your Netlify App URL.
4. Koyeb will automatically use the `Procfile` to start both the FastAPI server and the Bot.

### Frontend (Netlify)
1. Drag and drop the `frontend/` folder to [Netlify Drop](https://app.netlify.com/drop).
2. Copy the resulting URL and paste it into Koyeb's `WEBAPP_URL`.
3. Update the `API_URL` in `frontend/app.js` and `frontend/teacher.js` to point to your Koyeb URL.
