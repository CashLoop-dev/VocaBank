# Telegram Bot and API System

This project is a Telegram bot integrated with an API system for managing calls, SMS, and user roles. It uses SQLite for data storage and supports Twilio for call and SMS functionalities.

## Features

### Telegram Bot
- Add, delete, and manage users.
- Promote users to admin roles.
- Make calls to phone numbers with service-specific options.
- Fetch user information.
- Cancel ongoing commands.

### API System
- Handle calls and SMS using Twilio.
- Manage call and SMS statuses.
- Stream audio files for calls.
- Retrieve call details using `callSid`.

### Database
- SQLite database for storing user, call, and SMS data.
- Automatic creation of tables if they don't exist.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQLite3
- Twilio account for call and SMS services
- Telegram bot token

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
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

## Testing

Run tests for the API:

```bash
cd api
npm test
```

## Project Structure

```
.
├── telegram/
│   ├── bot.js
│   ├── commands/
│   ├── middleware/
│   ├── utils/
│   ├── db.js
│   ├── config.js
│   ├── .env
│   └── package.json
├── api/
│   ├── app.js
│   ├── routes/
│   ├── middleware/
│   ├── test/
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