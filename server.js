const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'kroto_battle_secret_key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Подключение к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/krotobattle';

console.log('Попытка подключения к MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Подключено к MongoDB успешно');
})
.catch(err => {
  console.error('❌ Ошибка подключения к MongoDB:', err);
  console.log('💡 Используется локальная база данных в памяти');
});

// Схема пользователя
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  coins: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  clicks: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Система достижений
  achievements: {
    type: Map,
    of: Boolean,
    default: {}
  },
  // Ежедневные награды
  lastDailyReward: {
    type: Date,
    default: null
  },
  dailyStreak: {
    type: Number,
    default: 0
  },
  // Скины
  skins: {
    type: [String],
    default: ['default']
  },
  currentSkin: {
    type: String,
    default: 'default'
  },
  // Бонусные предметы
  bonusItems: {
    type: Map,
    of: Number,
    default: {}
  },
  // Специальные события
  eventProgress: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Попытка создать модель, если MongoDB недоступна - используем локальное хранилище
let User;
try {
  User = mongoose.model('User', userSchema);
} catch (e) {
  console.log('⚠️  MongoDB недоступна, используем локальное хранилище');
  // Локальное хранилище для разработки
  let localUsers = {};
  
  User = {
    find: async (query) => {
      const users = Object.values(localUsers).filter(user => {
        if (query.lastActive && user.lastActive < query.lastActive.$gte) return false;
        if (query.coins && user.coins <= 0) return false;
        return true;
      });
      return users.sort((a, b) => b.coins - a.coins).slice(0, 20);
    },
    findById: async (id) => localUsers[id] || null,
    findOne: async (query) => {
      return Object.values(localUsers).find(user => user.username === query.username) || null;
    },
    findByIdAndUpdate: async (id, updateData, options) => {
      if (localUsers[id]) {
        localUsers[id] = { ...localUsers[id], ...updateData, _id: id };
        return localUsers[id];
      }
      return null;
    }
  };
  
  // Добавим метод для создания пользователей
  User.create = async (userData) => {
    const id = Date.now().toString();
    const user = { 
      ...userData, 
      _id: id, 
      lastActive: new Date(),
      achievements: {},
      lastDailyReward: null,
      dailyStreak: 0,
      skins: ['default'],
      currentSkin: 'default',
      bonusItems: {},
      eventProgress: {}
    };
    localUsers[id] = user;
    return user;
  };
}

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа отсутствует' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

// Маршруты API

// Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Проверка входных данных
    if (!username || !password) {
      return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Имя пользователя должно быть от 3 до 20 символов' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    // Проверка существующего пользователя
    let existingUser;
    try {
      existingUser = await User.findOne({ username });
    } catch (e) {
      // Если MongoDB недоступна, проверяем локально
      existingUser = null;
    }
    
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание нового пользователя
    let user;
    try {
      user = await User.create({
        username,
        password: hashedPassword
      });
    } catch (e) {
      // Если MongoDB недоступна, создаем локально
      user = {
        _id: Date.now().toString(),
        username,
        password: hashedPassword,
        coins: 0,
        level: 1,
        clicks: 0,
        achievements: {},
        lastDailyReward: null,
        dailyStreak: 0,
        skins: ['default'],
        currentSkin: 'default',
        bonusItems: {},
        eventProgress: {}
      };
    }

    // Создание токена
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET);

    res.status(201).json({
      message: 'Регистрация успешна',
      token,
      user: {
        username: user.username,
        coins: user.coins,
        level: user.level,
        clicks: user.clicks,
        achievements: user.achievements,
        lastDailyReward: user.lastDailyReward,
        dailyStreak: user.dailyStreak,
        skins: user.skins,
        currentSkin: user.currentSkin,
        bonusItems: user.bonusItems,
        eventProgress: user.eventProgress
      }
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вход
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    }

    // Поиск пользователя
    let user;
    try {
      user = await User.findOne({ username });
    } catch (e) {
      // Если MongoDB недоступна, возвращаем ошибку
      return res.status(400).json({ error: 'Сервис временно недоступен' });
    }
    
    if (!user) {
      return res.status(400).json({ error: 'Неверное имя пользователя или пароль' });
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Неверное имя пользователя или пароль' });
    }

    // Создание токена
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET);

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        username: user.username,
        coins: user.coins,
        level: user.level,
        clicks: user.clicks,
        achievements: user.achievements || {},
        lastDailyReward: user.lastDailyReward,
        dailyStreak: user.dailyStreak,
        skins: user.skins || ['default'],
        currentSkin: user.currentSkin,
        bonusItems: user.bonusItems || {},
        eventProgress: user.eventProgress || {}
      }
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение данных пользователя
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    let user;
    try {
      user = await User.findById(req.user.userId);
    } catch (e) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Обновляем время последней активности
    try {
      await User.findByIdAndUpdate(
        req.user.userId,
        { lastActive: Date.now() },
        { new: true }
      );
    } catch (e) {
      // Игнорируем ошибки обновления для локального хранилища
    }

    res.json({
      user: {
        username: user.username,
        coins: user.coins,
        level: user.level,
        clicks: user.clicks,
        achievements: user.achievements || {},
        lastDailyReward: user.lastDailyReward,
        dailyStreak: user.dailyStreak,
        skins: user.skins || ['default'],
        currentSkin: user.currentSkin,
        bonusItems: user.bonusItems || {},
        eventProgress: user.eventProgress || {}
      }
    });
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление статистики
app.post('/api/update-stats', authenticateToken, async (req, res) => {
  try {
    const { coins, level, clicks, achievements, bonusItems, eventProgress } = req.body;

    let user;
    try {
      user = await User.findByIdAndUpdate(
        req.user.userId,
        { 
          coins, 
          level, 
          clicks,
          lastActive: Date.now(),
          ...(achievements !== undefined && { achievements }),
          ...(bonusItems !== undefined && { bonusItems }),
          ...(eventProgress !== undefined && { eventProgress })
        },
        { new: true }
      );
    } catch (e) {
      // Для локального хранилища
      user = { 
        coins, 
        level, 
        clicks, 
        username: req.user.username,
        achievements: achievements || {},
        bonusItems: bonusItems || {},
        eventProgress: eventProgress || {}
      };
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      message: 'Статистика обновлена',
      user: {
        username: user.username,
        coins: user.coins,
        level: user.level,
        clicks: user.clicks,
        achievements: user.achievements || {},
        lastDailyReward: user.lastDailyReward,
        dailyStreak: user.dailyStreak,
        skins: user.skins || ['default'],
        currentSkin: user.currentSkin,
        bonusItems: user.bonusItems || {},
        eventProgress: user.eventProgress || {}
      }
    });
  } catch (error) {
    console.error('Ошибка обновления статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение таблицы лидеров
app.get('/api/leaderboard', async (req, res) => {
  try {
    // Получаем топ-20 игроков по монетам
    // Только активные за последние 7 дней
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    let leaderboard;
    try {
      leaderboard = await User.find({
        lastActive: { $gte: oneWeekAgo },
        coins: { $gt: 0 }
      });
    } catch (e) {
      // Если MongoDB недоступна, возвращаем пустой массив
      leaderboard = [];
    }
    
    // Сортируем и ограничиваем
    leaderboard = leaderboard
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 20)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        coins: user.coins,
        level: user.level
      }));

    res.json({
      leaderboard
    });
  } catch (error) {
    console.error('Ошибка получения таблицы лидеров:', error);
    res.status(500).json({ 
      leaderboard: [],
      error: 'Ошибка сервера' 
    });
  }
});

// Получение ежедневной награды
app.post('/api/daily-reward', authenticateToken, async (req, res) => {
  try {
    let user;
    try {
      user = await User.findById(req.user.userId);
    } catch (e) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const now = new Date();
    const lastReward = user.lastDailyReward ? new Date(user.lastDailyReward) : null;
    
    // Проверяем, можно ли получить награду
    if (lastReward) {
      const nextReward = new Date(lastReward);
      nextReward.setHours(nextReward.getHours() + 24);
      
      if (now < nextReward) {
        const hoursLeft = Math.ceil((nextReward - now) / (1000 * 60 * 60));
        return res.status(400).json({ 
          error: `Следующая награда через ${hoursLeft} часов`,
          nextReward: nextReward
        });
      }
    }

    // Проверяем серию дней
    let streak = user.dailyStreak || 0;
    if (lastReward) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Если последняя награда была вчера или сегодня - продолжаем серию
      if (lastReward.toDateString() === yesterday.toDateString() || 
          lastReward.toDateString() === now.toDateString()) {
        streak++;
      } else {
        streak = 1; // Начинаем новую серию
      }
    } else {
      streak = 1; // Первая награда
    }

    // Рассчитываем награду
    const baseReward = 100;
    const streakBonus = streak * 50;
    const totalReward = baseReward + streakBonus;

    // Обновляем данные пользователя
    try {
      user = await User.findByIdAndUpdate(
        req.user.userId,
        { 
          lastDailyReward: now,
          dailyStreak: streak,
          coins: (user.coins || 0) + totalReward
        },
        { new: true }
      );
    } catch (e) {
      // Для локального хранилища
      user.lastDailyReward = now;
      user.dailyStreak = streak;
      user.coins = (user.coins || 0) + totalReward;
    }

    res.json({
      message: `Ежедневная награда получена! Серия: ${streak} дней`,
      reward: totalReward,
      streak: streak,
      user: {
        coins: user.coins,
        lastDailyReward: user.lastDailyReward,
        dailyStreak: user.dailyStreak
      }
    });
  } catch (error) {
    console.error('Ошибка получения ежедневной награды:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Покупка скина
app.post('/api/buy-skin', authenticateToken, async (req, res) => {
  try {
    const { skinId } = req.body;
    
    let user;
    try {
      user = await User.findById(req.user.userId);
    } catch (e) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Список скинов с ценами
    const skins = {
      'cyber': 500,
      'gold': 1000,
      'diamond': 2000,
      'rainbow': 5000,
      'space': 3000,
      'fire': 4000
    };

    const skinPrice = skins[skinId];
    if (!skinPrice) {
      return res.status(400).json({ error: 'Недопустимый скин' });
    }

    // Проверяем, есть ли уже этот скин
    const userSkins = user.skins || ['default'];
    if (userSkins.includes(skinId)) {
      return res.status(400).json({ error: 'Скин уже куплен' });
    }

    // Проверяем, достаточно ли монет
    if ((user.coins || 0) < skinPrice) {
      return res.status(400).json({ error: 'Недостаточно монет' });
    }

    // Покупаем скин
    const newSkins = [...userSkins, skinId];
    const newCoins = (user.coins || 0) - skinPrice;

    try {
      user = await User.findByIdAndUpdate(
        req.user.userId,
        { 
          skins: newSkins,
          coins: newCoins
        },
        { new: true }
      );
    } catch (e) {
      // Для локального хранилища
      user.skins = newSkins;
      user.coins = newCoins;
    }

    res.json({
      message: 'Скин успешно куплен!',
      user: {
        coins: user.coins,
        skins: user.skins
      }
    });
  } catch (error) {
    console.error('Ошибка покупки скина:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Смена скина
app.post('/api/change-skin', authenticateToken, async (req, res) => {
  try {
    const { skinId } = req.body;
    
    let user;
    try {
      user = await User.findById(req.user.userId);
    } catch (e) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверяем, есть ли этот скин у пользователя
    const userSkins = user.skins || ['default'];
    if (!userSkins.includes(skinId)) {
      return res.status(400).json({ error: 'Скин не куплен' });
    }

    // Меняем скин
    try {
      user = await User.findByIdAndUpdate(
        req.user.userId,
        { currentSkin: skinId },
        { new: true }
      );
    } catch (e) {
      // Для локального хранилища
      user.currentSkin = skinId;
    }

    res.json({
      message: 'Скин успешно изменен!',
      user: {
        currentSkin: user.currentSkin
      }
    });
  } catch (error) {
    console.error('Ошибка смены скина:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение бонусных предметов пользователя
app.get('/api/bonus-items', authenticateToken, async (req, res) => {
  try {
    let user;
    try {
      user = await User.findById(req.user.userId);
    } catch (e) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      bonusItems: user.bonusItems || {}
    });
  } catch (error) {
    console.error('Ошибка получения бонусных предметов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Использование бонусного предмета
app.post('/api/use-bonus', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    let user;
    try {
      user = await User.findById(req.user.userId);
    } catch (e) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Список бонусных предметов
    const bonusItems = {
      'double_points': { name: 'Удвоение монет', duration: 30 }, // 30 секунд
      'auto_click': { name: 'Автоклик', clicks: 10 }, // 10 автокликов
      'coin_boost': { name: 'Бонус монет', coins: 100 }, // 100 бонусных монет
      'lucky_drop': { name: 'Удачный дроп', coins: 250 } // 250 бонусных монет
    };

    const item = bonusItems[itemId];
    if (!item) {
      return res.status(400).json({ error: 'Недопустимый предмет' });
    }

    // Проверяем, есть ли предмет
    const userBonusItems = user.bonusItems || {};
    const itemCount = userBonusItems[itemId] || 0;
    if (itemCount <= 0) {
      return res.status(400).json({ error: 'Предмет не найден' });
    }

    // Используем предмет
    const newBonusItems = { ...userBonusItems };
    newBonusItems[itemId] = itemCount - 1;

    // Применяем эффект
    let effectMessage = '';
    let effectData = {};
    
    if (itemId === 'double_points') {
      effectMessage = 'Удвоение монет активировано на 30 секунд!';
      effectData = { doublePoints: true, doublePointsTime: 30 };
    } else if (itemId === 'auto_click') {
      effectMessage = 'Автоклик активирован! Получено 10 кликов!';
      effectData = { autoClicks: 10 };
    } else if (itemId === 'coin_boost') {
      effectMessage = 'Бонус монет! Получено 100 монет!';
      effectData = { coinBoost: 100 };
    } else if (itemId === 'lucky_drop') {
      effectMessage = 'Удачный дроп! Получено 250 монет!';
      effectData = { coinBoost: 250 };
    }

    try {
      user = await User.findByIdAndUpdate(
        req.user.userId,
        { bonusItems: newBonusItems },
        { new: true }
      );
    } catch (e) {
      // Для локального хранилища
      user.bonusItems = newBonusItems;
    }

    res.json({
      message: effectMessage,
      effect: effectData,
      user: {
        bonusItems: user.bonusItems
      }
    });
  } catch (error) {
    console.error('Ошибка использования бонуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение ежедневных событий
app.get('/api/daily-events', authenticateToken, async (req, res) => {
  try {
    let user;
    try {
      user = await User.findById(req.user.userId);
    } catch (e) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Генерируем ежедневные события
    const events = [
      { 
        id: 'click_challenge', 
        title: 'Клик-челлендж', 
        desc: 'Сделайте 25 кликов', 
        target: 25,
        reward: '200 монет + 1 бонусный предмет',
        type: 'clicks'
      },
      { 
        id: 'level_up', 
        title: 'Повышение уровня', 
        desc: 'Достигните уровня 3', 
        target: 3,
        reward: '300 монет',
        type: 'level'
      },
      { 
        id: 'coin_sprint', 
        title: 'Спринт монет', 
        desc: 'Наберите 500 монет', 
        target: 500,
        reward: '400 монет + 2 бонусных предмета',
        type: 'coins'
      },
      { 
        id: 'daily_login', 
        title: 'Ежедневный вход', 
        desc: 'Войдите в игру сегодня', 
        target: 1,
        reward: '100 монет',
        type: 'login'
      },
      { 
        id: 'combo_click', 
        title: 'Комбо-клик', 
        desc: 'Сделайте 5 кликов подряд за 5 секунд', 
        target: 5,
        reward: '500 монет',
        type: 'combo'
      }
    ];

    res.json({ events });
  } catch (error) {
    console.error('Ошибка получения событий:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Покупка бонусных предметов
app.post('/api/buy-bonus', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    let user;
    try {
      user = await User.findById(req.user.userId);
    } catch (e) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Список бонусных предметов с ценами
    const bonusItems = {
      'double_points': 200,
      'auto_click': 150,
      'coin_boost': 100,
      'lucky_drop': 300
    };

    const itemPrice = bonusItems[itemId];
    if (!itemPrice) {
      return res.status(400).json({ error: 'Недопустимый предмет' });
    }

    // Проверяем, достаточно ли монет
    if ((user.coins || 0) < itemPrice) {
      return res.status(400).json({ error: 'Недостаточно монет' });
    }

    // Покупаем предмет
    const userBonusItems = user.bonusItems || {};
    const newItemCount = (userBonusItems[itemId] || 0) + 1;
    const newBonusItems = { ...userBonusItems, [itemId]: newItemCount };
    const newCoins = (user.coins || 0) - itemPrice;

    try {
      user = await User.findByIdAndUpdate(
        req.user.userId,
        { 
          bonusItems: newBonusItems,
          coins: newCoins
        },
        { new: true }
      );
    } catch (e) {
      // Для локального хранилища
      user.bonusItems = newBonusItems;
      user.coins = newCoins;
    }

    res.json({
      message: 'Предмет успешно куплен!',
      user: {
        coins: user.coins,
        bonusItems: user.bonusItems
      }
    });
  } catch (error) {
    console.error('Ошибка покупки бонуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🎮 Откройте http://localhost:${PORT} в браузере`);
  console.log(`📊 API доступно по адресу: http://localhost:${PORT}/api/`);
});