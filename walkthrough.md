# School Test Telegram Mini App - Project Walkthrough

We have successfully built a full-stack Telegram Mini App for administering school tests with Rasch Model scoring.

## 🚀 Accomplishments

### 1. Backend & Scoring Engine
- **FastAPI Core:** Complete REST API in `backend/main.py` for managing users, tests, and submissions.
- **Rasch Model:** Implemented Item Response Theory scoring in `backend/rasch.py` to calculate person ability and item difficulty.
- **Database:** SQLAlchemy models with local SQLite support (and Neon PostgreSQL readiness).

### 2. Telegram Bot (@TarixTestSarvar_bot)
- **Aiogram 3.x:** A modern bot in `backend/bot.py` that handles `/start` and provides a native WebApp keyboard.
- **File Distribution:** Teachers can upload PDFs/Images to the bot, which extracts a `file_id` for distribution to students.

### 3. Frontend Mini App
- **Vanilla JS + Telegram WebApp API:** Responsive UI in `frontend/` using native Telegram CSS variables for a seamless "Look & Feel".
- **Digital Bubble Sheet:** Dynamic quiz interface that maps questions to A/B/C/D buttons and handles secure submission.

## 🛠️ Current State
- **Backend:** Running locally on `http://127.0.0.1:8000`
- **Bot:** Running and polling for updates.
- **Menu Button:** Successfully linked to [lighthearted-elf-ab2330.netlify.app](https://lighthearted-elf-ab2330.netlify.app)

---
> [!TIP]
> To test the teacher flow, use the `/docs` UI to create a test, then use the bot to upload a PDF and associate it!
