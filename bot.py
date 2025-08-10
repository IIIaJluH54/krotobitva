import os
import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

# Поддержка .env (не обязательна, но удобно при локальной разработке)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Логирование
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Получаем токен и URL из переменных окружения
BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN не найден в переменных окружения (BOT_TOKEN)")

GAME_URL = os.getenv("GAME_URL", "https://iiiajluh54.github.io/krotobitva/")


# Небольшая утилита для экранирования MarkdownV2 (чтобы избежать ошибок форматирования)
def escape_md_v2(text: str) -> str:
    # Экранируем символы, которые важны для MarkdownV2
    to_escape = r'\_*[]()~`>#+-=|{}.!'
    return ''.join(f'\\{c}' if c in to_escape else c for c in text)


# Инициализация бота
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

def get_keyboard():
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🎮 Играть в Крото Битва", web_app={"url": GAME_URL})]
    ])
    return keyboard


@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    text = "🕳️ *Крото Битва*\n\n" \
           "Слепой, но сильный.\n" \
           "Маленький, но яростный.\n\n" \
           "Готов к подземным боям?"
    # Экранируем текст, на случай, если что-то динамическое будет добавлено
    try:
        await message.answer(escape_md_v2(text), reply_markup=get_keyboard(), parse_mode="MarkdownV2")
    except Exception as e:
        logger.exception("Ошибка при отправке /start: %s", e)
        # Фолбэк без форматирования
        await message.answer("🕳️ Крото Битва\n\nГотов к подземным боям?", reply_markup=get_keyboard())


@dp.message(Command("play"))
async def cmd_play(message: types.Message):
    try:
        await message.answer("💥 Вперёд, в бой! Рои, бей, побеждай!", reply_markup=get_keyboard())
    except Exception as e:
        logger.exception("Ошибка при отправке /play: %s", e)


async def main():
    logger.info("Запуск бота 'Крото Битва'")
    try:
        await dp.start_polling(bot)
    except asyncio.CancelledError:
        logger.info("Polling cancelled")
        raise
    except Exception as e:
        logger.exception("Неожиданная ошибка polling: %s", e)
    finally:
        # Гарантированно закрываем session у Bot
        try:
            await bot.session.close()
            logger.info("Bot session closed")
        except Exception as e:
            logger.exception("Ошибка при закрытии bot.session: %s", e)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Остановлен CTRL+C")