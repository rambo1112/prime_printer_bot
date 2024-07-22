const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const TOKEN = process.env.TOKEN; // Retrieve token from environment variable
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

const BOT_USERNAME = '@prime_printer_bot';
let stopPrinting = false;

function isPrime(n) {
  if (n <= 1) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function printPrimes(chatId) {
  let i = 0;
  async function printPrimeMessage() {
    if (stopPrinting) return;
    if (isPrime(i)) {
      try {
        await bot.sendMessage(chatId, i.toString());
      } catch (e) {
        console.error(`Error sending message: ${e}`);
      }
    }
    i++;
    setTimeout(printPrimeMessage, 100); // Add a delay to avoid rate limiting
  }
  printPrimeMessage();
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  stopPrinting = false;
  bot.sendMessage(chatId, 'Prime number printing has started! Type /stop to stop printing.');
  printPrimes(chatId);
});

bot.onText(/\/stop/, (msg) => {
  stopPrinting = true;
  bot.sendMessage(msg.chat.id, 'Prime number printing has been stopped.');
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `Hi! I'm Prime Printer Bot.
Use /start to begin printing prime numbers.
Use /stop to stop printing numbers.
Use /help to display this message.`;
  bot.sendMessage(msg.chat.id, helpMessage);
});

function handleResponse(text) {
  const processed = text.toLowerCase();
  if (processed.includes('hello')) return 'Hey there!';
  if (processed.includes('bye')) return 'See you later!';
  return "I'm sorry, I didn't understand that. Can you rephrase?";
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text.startsWith('/')) { // Only handle non-command messages
    console.log(`User (${chatId}) in ${msg.chat.type} chat said: "${text}"`);

    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
      if (text.includes(BOT_USERNAME)) {
        const newText = text.replace(BOT_USERNAME, '').trim();
        const response = handleResponse(newText);
        bot.sendMessage(chatId, response);
      }
    } else {
      const response = handleResponse(text);
      bot.sendMessage(chatId, response);
    }
  }
});

bot.on('polling_error', (error) => {
  console.error(`Polling error: ${error.code} - ${error.message}`);
});

// Set up Express server
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Bot is running...');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

console.log('Polling...');
