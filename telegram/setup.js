/**
 * Database setup and initialization module.
 * This module ensures the SQLite database is properly configured and provides access to the database instance.
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const config = require('./config');

// Ensure the database directory exists
const dbDir = path.resolve(__dirname, './db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'data.db');
let db;

/**
 * Initializes the SQLite database.
 * - Creates the `users` table if it doesn't exist.
 * - Inserts the default admin user if configured.
 * 
 * @throws {Error} If the database initialization fails.
 */
async function initDatabase() {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create the users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        telegram_id INTEGER UNIQUE,
        username TEXT UNIQUE,
        role TEXT DEFAULT 'user',
        bio TEXT DEFAULT NULL
      )
    `);

    // Insert default admin user
    if (config.telegramId && config.adminUsername) {
      await db.run(
        `INSERT OR IGNORE INTO users (telegram_id, username, role)
         VALUES (?, ?, 'admin')`,
        [config.telegramId, config.adminUsername]
      );
      console.log('✅ Default admin inserted:', config.adminUsername);
    } else {
      console.warn('⚠️ ADMIN_TELEGRAM_ID or ADMIN_USERNAME not set in .env');
    }

    console.log('✅ Connected to the SQLite database.');
  } catch (error) {
    console.error('❌ Failed to initialize the database:', error.message);
    throw error;
  }
}

/**
 * Retrieves the database instance.
 * 
 * @returns {sqlite3.Database} The database instance.
 * @throws {Error} If the database is not initialized.
 */
function getDb() {
  if (!db) throw new Error('Database not initialized!');
  return db;
}

module.exports = { initDatabase, getDb };