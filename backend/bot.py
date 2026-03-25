import os
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import Message, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-netlify-url.netlify.app")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def start_handler(message: Message):
    await message.answer(
        "Welcome! Your Test App is ready. Click the button at the bottom left to start.\nTeachers: Use /teacher to open the dashboard."
    )

@dp.message(Command("teacher"))
async def teacher_handler(message: Message):
    # In production, use the Netlify URL for teacher.html
    kb = types.ReplyKeyboardMarkup(
        keyboard=[
            [types.KeyboardButton(text="Open Teacher Dashboard", web_app=WebAppInfo(url=f"{WEBAPP_URL}/teacher.html"))]
        ],
        resize_keyboard=True
    )
    await message.answer("Click below to manage tests:", reply_markup=kb)

@dp.message()
async def doc_handler(message: Message):
    if message.document:
        file_id = message.document.file_id
        await message.answer(f"File received. To associate it with a test, copy this File ID:\n`{file_id}`", parse_mode="Markdown")
    else:
        await message.answer("Send me a document (PDF of the test) and I'll give you its file ID.")

async def main():
    logging.basicConfig(level=logging.INFO)
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
