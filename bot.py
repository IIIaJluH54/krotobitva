import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
import asyncio

# Получаем токен из переменной окружения
BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN не найден в Secrets!")

# 🔗 Замени на свой URL после публикации
GAME_URL = "https://iiiajluh54.github.io/krotobitva/"

# Инициализация
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

def get_keyboard():
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="🎮 Играть в Крото Битва",
            web_app={"url": GAME_URL}
        )]
    ])
    return keyboard

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "🕳️ *Крото Битва*\n\n"
        "Слепой, но сильный.\n"
        "Маленький, но яростный.\n\n"
        "Готов к подземным боям?",
        reply_markup=get_keyboard(),
        parse_mode="Markdown"
    )

@dp.message(Command("play"))
async def cmd_play(message: types.Message):
    await message.answer(
        "💥 Вперёд, в бой! Рои, бей, побеждай!",
        reply_markup=get_keyboard()
    )

async def main():
    print("✅ Бот 'Крото Битва' запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
