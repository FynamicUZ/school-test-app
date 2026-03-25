import os
import logging
import asyncio
from datetime import datetime
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import Message, WebAppInfo
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from . import models, database

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-netlify-url.netlify.app")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

class Registration(StatesGroup):
    waiting_for_name = State()

@dp.message(Command("start"))
async def start_handler(message: Message, state: FSMContext):
    db: Session = database.SessionLocal()
    user = db.query(models.User).filter(models.User.telegram_id == str(message.from_user.id)).first()
    
    if not user:
        await message.answer("Assalomu alaykum! Botdan foydalanish uchun ism va familiyangizni kiriting:")
        await state.set_state(Registration.waiting_for_name)
    else:
        await message.answer(
            f"Xush kelibsiz, {user.name}! \n\nTestlarni ishlash uchun pastdagi tugmani bosing.\nO'qituvchilar uchun: /teacher",
            reply_markup=types.ReplyKeyboardMarkup(
                keyboard=[[types.KeyboardButton(text="Testni ochish", web_app=WebAppInfo(url=WEBAPP_URL))]],
                resize_keyboard=True
            )
        )
    db.close()

@dp.message(Registration.waiting_for_name)
async def name_handler(message: Message, state: FSMContext):
    name = message.text
    db: Session = database.SessionLocal()
    new_user = models.User(
        telegram_id=str(message.from_user.id),
        name=name,
        role="student"
    )
    db.add(new_user)
    db.commit()
    db.close()
    
    await state.clear()
    await message.answer(
        f"Rahmat, {name}! Endi testlarni topshirishingiz mumkin.",
        reply_markup=types.ReplyKeyboardMarkup(
            keyboard=[[types.KeyboardButton(text="Testni ochish", web_app=WebAppInfo(url=WEBAPP_URL))]],
            resize_keyboard=True
        )
    )

@dp.message(Command("teacher"))
async def teacher_handler(message: Message):
    kb = types.ReplyKeyboardMarkup(
        keyboard=[
            [types.KeyboardButton(text="O'qituvchi paneli", web_app=WebAppInfo(url=f"{WEBAPP_URL}/teacher.html"))]
        ],
        resize_keyboard=True
    )
    await message.answer("Boshqaruv panelini ochish uchun pastdagi tugmani bosing:", reply_markup=kb)

async def check_test_endings():
    """Background task to check for finished tests and send leaderboards."""
    while True:
        try:
            db: Session = database.SessionLocal()
            now = datetime.utcnow()
            # Find tests where end_time has passed and leaderboard hasn't been sent
            ended_tests = db.query(models.Test).filter(
                models.Test.end_time <= now,
                models.Test.sent_leaderboard == False
            ).all()

            for test in ended_tests:
                # Get all submissions
                subs = db.query(models.Submission).filter(models.Submission.test_id == test.id).all()
                if not subs:
                    test.sent_leaderboard = True
                    db.commit()
                    continue

                # Prepare leaderboard
                results = []
                key = test.answer_key.split(',')
                for s in subs:
                    u = db.query(models.User).filter(models.User.telegram_id == s.student_id).first()
                    ans = s.answers.split(',')
                    correct = sum(1 for i in range(len(key)) if i < len(ans) and ans[i] == key[i])
                    results.append((u.name if u else f"ID:{s.student_id}", correct))

                # Sort results
                results.sort(key=lambda x: x[1], reverse=True)
                
                leaderboard_text = f"🏁 **Test yakunlandi: {test.title}**\n\nNatijalar jadvali:\n"
                for i, (name, score) in enumerate(results, 1):
                    leaderboard_text += f"{i}. {name} — {score}/{len(key)}\n"
                
                try:
                    # Notify teacher
                    await bot.send_message(test.teacher_id, leaderboard_text, parse_mode="Markdown")
                    test.sent_leaderboard = True
                    db.commit()
                except Exception as e:
                    logging.error(f"Failed to send leaderboard to {test.teacher_id}: {e}")

            db.close()
        except Exception as e:
            logging.error(f"Error in background task: {e}")
        
        await asyncio.sleep(60)

async def main():
    logging.basicConfig(level=logging.INFO)
    asyncio.create_task(check_test_endings())
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
