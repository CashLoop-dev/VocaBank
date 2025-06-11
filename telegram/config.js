require('dotenv').config();

// Validate required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('❌ TELEGRAM_BOT_TOKEN is not set in the environment variables.');
}
if (!process.env.ADMIN_TELEGRAM_ID) {
    throw new Error('❌ ADMIN_TELEGRAM_ID is not set in the environment variables.');
}

// Export configuration
module.exports = {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN, // Telegram bot token
    apiUrl: process.env.API_URL || 'https://api.example.com', // Default API URL if not provided
    apiPassword: process.env.API_PASSWORD || '', // Optional API password
    telegramId: process.env.ADMIN_TELEGRAM_ID, // Admin Telegram ID
    //secretPassword: process.env.SECRET_PASSWORD || 'default_secret', // Default secret password
    adminUsername: process.env.ADMIN_USERNAME || 'admin' // Default admin username
};
