require('dotenv').config();

console.log('--- СТАРТ БЭКЕНДА ---');
console.log('Бэкенд: ADMIN_PASSWORD из .env (при старте сервера):', `"${process.env.ADMIN_PASSWORD}"`, `(длина: ${process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 'N/A'})`);

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');


// email telegram
const { notifyAdmin } = require('./Utils/notifications');


const fs = require('fs');
const path = require('path');



const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD_FROM_ENV = process.env.ADMIN_PASSWORD;

// Раздача статических файлов из /upload
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// Загрузка данных из db.json
const dbPath = path.join(__dirname, 'db.json');


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); 

// Роут для авторизации админа
app.post('/admin-login', (req, res) => {
  const { password } = req.body;

  const trimmedFrontendPassword = password ? String(password).trim() : '';
  const trimmedAdminPassword = ADMIN_PASSWORD_FROM_ENV ? String(ADMIN_PASSWORD_FROM_ENV).trim() : '';

  if (trimmedFrontendPassword === trimmedAdminPassword) {
    console.log("Бэкенд: Пароли СОВПАЛИ. Доступ предоставлен.");
    res.status(200).json({ message: 'Access granted' });
  } else {
    console.log("Бэкенд: Пароли НЕ СОВПАЛИ. Отклоняю доступ.");
    res.status(401).json({ message: 'Неверный пароль' });
  }
});

// Получение всех товаров
app.get('/api/products', (req, res) => {
  fs.readFile(dbPath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ message: "Ошибка чтения файла" });
    const db = JSON.parse(data);
    if (db.products) {
      res.status(200).json(db.products);
    } else {
      res.status(404).json({ message: 'Товары не найдены в db.json' });
    }
  });
});

// Получение товара по ID
app.get('/api/products/:id', (req, res) => {
  fs.readFile(dbPath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ message: "Ошибка чтения файла" });

    const db = JSON.parse(data);
    const productId = parseInt(req.params.id, 10);
    const product = db.products?.find(p => p.id === productId);

    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ message: 'Товар не найден' });
    }
  });
});

// Роут для создания заказа
// Роут для создания заказа (асинхронная версия)
app.post("/api/orders", async (req, res) => {
  const newOrder = req.body;
  newOrder.id = Date.now();
  newOrder.date = new Date().toISOString();

  try {
    const fileData = await fs.promises.readFile(dbPath, "utf8");
    const db = JSON.parse(fileData);

    // Если orders ещё нет — создаём
    if (!db.orders) db.orders = [];

    db.orders.unshift(newOrder); // Добавляем новый заказ в начало

    await fs.promises.writeFile(dbPath, JSON.stringify(db, null, 2));

    await notifyAdmin(newOrder);

    res.status(201).json({ message: "Заказ создан" });
  } catch (err) {
    console.error("Ошибка обработки заказа:", err.message);
    res.status(500).json({ message: "Не удалось обработать заказ" });
  }
});


// Общий роут
app.get("/api", (req, res) => {
  fs.readFile(dbPath, "utf8", (err, data) => {
    if (err) {
      console.error("Ошибка чтения db.json:", err.message);
      return res.status(500).json({ message: "Ошибка чтения файла" });
    }

    try {
      const parsed = JSON.parse(data);
      return res.json(parsed);
    } catch (parseErr) {
      console.error("Ошибка парсинга JSON:", parseErr.message);
      return res.status(500).json({ message: "Неверный формат данных в db.json" });
    }
  });
});


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
  console.log('---------------------------\n');
});


app.get("/", (req, res) => {
  res.send("Backend работает! Добро пожаловать 👋");
});











