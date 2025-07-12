const axios = require('axios');
const nodemailer = require('nodemailer');

// Telegram уведомление
const sendTelegramAlert = async (order) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const message = `🛒 Новый заказ!\n\n👤 Имя: ${order.customer.name}\n📞 Телефон: ${order.customer.phone}\n📦 Адрес: ${order.customer.address}\n💬 Комментарий: ${order.customer.comment || '—'}\n\n📋 Товары:\n${order.items.map(i => `• ${i.name} ×${i.quantity}`).join('\n')}\n\n💰 Итого: $${order.total.toFixed(2)}`;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });
  } catch (error) {
    console.error('❌ Ошибка Telegram:', error.message);
  }
};

// Email уведомление
const sendEmailAlert = async (order) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // или другая почта
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `"Магазин" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: '📦 Новый заказ',
    text: `
Новый заказ:

Имя: ${order.customer.name}
Телефон: ${order.customer.phone}
Адрес: ${order.customer.address}
Комментарий: ${order.customer.comment || '—'}

Товары:
${order.items.map(i => `• ${i.name} ×${i.quantity}`).join('\n')}

Итого: $${order.total.toFixed(2)}
    `,
  };

  try {
    await transporter.sendMail(message);
  } catch (err) {
    console.error('❌ Email ошибка:', err.message);
  }
};




// Eail to user

const sendCustomerConfirmation = async (order) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // можно изменить, если нужно
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `"Магазин" <${process.env.EMAIL_USER}>`,
    to: order.customer.email, // ← отправка пользователю
    subject: '✅ Ваш заказ подтверждён',
    text: `
Здравствуйте, ${order.customer.name}!

Спасибо за ваш заказ. Вот его детали:

📞 Телефон: ${order.customer.phone}
📦 Адрес доставки: ${order.customer.address}
💬 Комментарий: ${order.customer.comment || '—'}

📋 Товары:
${order.items.map(i => `• ${i.name} ×${i.quantity}`).join('\n')}

💰 Итого: $${order.total.toFixed(2)}

Мы скоро свяжемся с вами для доставки!
  `,
  };

  try {
    await transporter.sendMail(message);
  } catch (err) {
    console.error('❌ Ошибка отправки клиенту:', err.message);
  }
};


// Универсальный экспорт
const notifyAdmin = async (order) => {
  await sendTelegramAlert(order);             // админу в Telegram
  await sendEmailAlert(order);                // админу на почту
  await sendCustomerConfirmation(order);      // пользователю на почту ← ДОБАВИЛИ
};


module.exports = {
  notifyAdmin,
};
