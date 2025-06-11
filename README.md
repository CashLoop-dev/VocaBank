# Telegram Bot and API System

This project is a Telegram bot integrated with an API system for managing calls, SMS, and user roles. It uses SQLite for data storage and supports Twilio for call and SMS functionalities.

## Features

### Telegram Bot
- Add, delete, and manage users.
- Promote users to admin roles.
- Make calls to phone numbers with service-specific options.
- Fetch user information.
- Cancel ongoing commands.
- Create and manage custom scripts for calls and SMS.

### API System
- Handle calls and SMS using Twilio.
- Manage call and SMS statuses.
- Stream audio files for calls.
- Retrieve call details using `callSid`.
- Create custom voice messages using Eleven Labs API.

### Database
- SQLite database for storing user, call, SMS, and script data.
- Automatic creation of tables if they don't exist.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQLite3
- Twilio account for call and SMS services
- Telegram bot token
- Eleven Labs API key (for text-to-speech conversion)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/otp-bot.git
   cd otp-bot
   ```

2. Install dependencies for both the Telegram bot and API:

   ```bash
   cd telegram
   npm install
   cd ../api
   npm install
   ```

3. Configure environment variables:

   - Copy the `.env` files from `example.env` in both `telegram` and `api` directories.
   - Fill in the required values in `.env` files.

   Example for `telegram/.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   API_URL=https://your-api-url
   API_PASSWORD=your-api-password
   ADMIN_TELEGRAM_ID=your-admin-id
   ADMIN_USERNAME=@your-admin-username
   ```

   Example for `api/.env`:
   ```env
   SETUP_DONE=true
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_CALLER_ID=your-twilio-caller-id
   API_PASSWORD=your-api-password
   SERVER_URL=https://your-server-url
   TELEGRAM_CHAT_ID=your-telegram-chat-id
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   ELEVEN_LABS_API_KEY=your-eleven-labs-api-key
   ELEVEN_LABS_VOICE_ID=your-eleven-labs-voice-id
   ```

4. Initialize the database:

   - For the Telegram bot:
     ```bash
     cd telegram
     node bot.js
     ```
   - For the API:
     ```bash
     cd api
     node api.js
     ```

## Usage

### Telegram Bot

1. Start the bot:
   ```bash
   cd telegram
   npm start
   ```

2. Use the following commands in Telegram:
   - `/user` - Manage users (add, delete, promote, fetch info).
   - `/call` - Make a call to a phone number.
   - `/script` - Create a new custom script for calls or SMS.
   - `/scripts` - List all available scripts.
   - `/deletescript [name]` - Delete a script.
   - `/help` - Get a list of commands and supported services.

### API

1. Start the API server:
   ```bash
   cd api
   npm start
   ```

2. Available API endpoints:
   - `POST /call` - Initiate a call.
   - `POST /sms` - Send an SMS.
   - `POST /get` - Retrieve call details.
   - `POST /status` - Update call or SMS status.
   - `GET /stream/:service` - Stream audio files for calls.
   - `POST /script` - Create a new script.
   - `POST /scripts` - Get all scripts.
   - `POST /script/get` - Get script by name.
   - `POST /script/delete` - Delete a script.

## Custom Scripts Feature

The custom scripts feature allows you to:

1. Create personalized call and SMS scripts through the Telegram bot.
2. For call scripts, automatically generate voice audio using Eleven Labs API.
3. Store and manage scripts for reuse.
4. Use custom scripts when making calls or sending SMS.

### Creating a Custom Script

1. Use the `/script` command in Telegram.
2. Follow the prompts to:
   - Enter a script name
   - Select script type (call or SMS)
   - Enter the script message
   - Confirm creation

### Using Custom Scripts

Once created, scripts can be used when making calls or sending SMS through the bot.

## Project Structure

```
.
├── telegram/
│   ├── bot.js
│   ├── commands/
│   │   ├── call.js
│   │   ├── help.js
│   │   ├── script.js
│   │   └── user.js
│   ├── middleware/
│   ├── utils/
│   ├── db/
│   ├── config.js
│   ├── .env
│   └── package.json
├── api/
│   ├── api.js
│   ├── app.js
│   ├── routes/
│   │   ├── call.js
│   │   ├── sms.js
│   │   ├── status.js
│   │   ├── get.js
│   │   ├── stream.js
│   │   └── script.js
│   ├── middleware/
│   ├── voice/
│   │   ├── en/
│   │   ├── fr/
│   │   └── scripts/
│   ├── db/
│   ├── config.js
│   ├── .env
│   └── package.json
└── README.md
```

## License

This project is licensed under the ISC License.

## Acknowledgments

- [Grammy](https://grammy.dev/) for Telegram bot framework.
- [Twilio](https://www.twilio.com/) for call and SMS services.
- [SQLite](https://sqlite.org/) for lightweight database management.
- [Eleven Labs](https://elevenlabs.io/) for text-to-speech API.
