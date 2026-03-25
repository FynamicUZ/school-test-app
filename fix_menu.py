import os
import asyncio
from aiogram import Bot
from aiogram.types import WebAppInfo, MenuButtonWebApp, MenuButtonDefault
from dotenv import load_dotenv

load_dotenv()

async def fix():
    token = os.getenv("BOT_TOKEN")
    url = os.getenv("WEBAPP_URL")
    
    bot = Bot(token=token)
    try:
        # Bu bitta va yagona ishlaydigan tugma
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="Open Test App",
                web_app=WebAppInfo(url=f"{url}?v=4")
            )
        )
        print(f"Bitta tugma muvaffaqiyatli o'rnatildi: {url}")
    except Exception as e:
        print(f"Xato: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(fix())
