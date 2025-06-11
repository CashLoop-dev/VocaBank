/**
 * Main entry point for the Telegram bot.
 * This file initializes the bot, sets up the database, and registers commands and middleware.
 */

const { Bot, session } = require('grammy');
const config = require('./config');
const { initDatabase, getDb } = require('./setup');

// Import command handlers
const callCommand = require('./commands/call');
const helpCommand = require('./commands/help');
const userCommand = require('./commands/user');

// Initialize the database and ensure the default admin exists
initDatabase().then(async () => {
  console.log('✅ Database initialized successfully');

  const db = getDb();
  const adminExists = await db.get('SELECT * FROM users WHERE telegram_id = ?', [config.telegramId]);
  if (!adminExists) {
    await db.run(
      'INSERT INTO users (telegram_id, username, role) VALUES (?, ?, ?)',
      [config.telegramId, config.adminUsername, 'admin']
    );
    console.log(`✅ Default admin inserted: @${config.adminUsername}`);
  }
}).catch((error) => {
  console.error('❌ Failed to initialize the database:', error.message);
  process.exit(1);
});

// Create a new bot instance
const bot = new Bot(config.telegramToken);

/**
 * Define the structure of the session object.
 * This is used to maintain state across user interactions.
 */
const initialSession = () => ({
  callSession: null, // Stores state for the /call command
  userSession: null, // Stores state for the /user command
});

// Apply session middleware to manage user state
bot.use(session({ initial: initialSession }));

// Register bot commands
console.log('ℹ️ Registering commands...');
bot.use(helpCommand); // Provides help and usage information
bot.use(callCommand); // Handles phone call requests
bot.use(userCommand); // Manages user-related operations
console.log('✅ Commands registered successfully');

// Global error handler for the bot
bot.catch((err) => {
  console.error('❌ Bot encountered an error:', err.error || err);
});

// Start the bot and listen for incoming updates
bot.start().then(() => {
  console.log('✅ Bot started successfully');
});