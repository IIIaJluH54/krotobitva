import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
import asyncio

BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN не найден!")

# 🔗 Замени на свой URL после загрузки
GAME_URL = "https://iiiajluh54.github.io/krotobitva/"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

def get_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🎮 Играть в Крото Битва", web_app={"url": GAME_URL})]
    ])

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "🕳️ *Крото Битва*\n\nСлепой, но сильный.\nМаленький, но яростный.",
        reply_markup=get_keyboard(),
        parse_mode="Markdown"
    )

@dp.message(Command("play"))
async def cmd_play(message: types.Message):
    await message.answer("💥 Вперёд, в бой!", reply_markup=get_keyboard())

async def main():
    print("✅ Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
