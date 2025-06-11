/**
 * Utility functions for interacting with the database.
 * These functions provide CRUD operations for the `users` table.
 */

const { getDb } = require('../setup');

/**
 * Fetches the role of a user by their Telegram ID.
 * 
 * @param {number} telegramId - The Telegram ID of the user.
 * @returns {string|null} The role of the user, or null if the user is not found.
 * @throws {Error} If the database query fails.
 */
async function getUserRole(telegramId) {
  try {
    const db = getDb();
    const user = await db.get(
      `SELECT role FROM users WHERE telegram_id = ?`,
      [telegramId]
    );
    return user ? user.role : null;
  } catch (error) {
    console.error('Error fetching user role:', error.message);
    throw error;
  }
}

/**
 * Fetches a user by their Telegram ID.
 * 
 * @param {number} telegramId - The Telegram ID of the user.
 * @returns {Object|null} The user object, or null if the user is not found.
 * @throws {Error} If the database query fails.
 */
async function getUser(telegramId) {
  try {
    const db = getDb();
    const user = await db.get(
      `SELECT * FROM users WHERE telegram_id = ?`,
      [telegramId]
    );
    return user || null;
  } catch (error) {
    console.error('Error fetching user:', error.message);
    throw error;
  }
}

/**
 * Fetches a user by their username.
 * 
 * @param {string} username - The username of the user.
 * @returns {Object|null} The user object, or null if the user is not found.
 * @throws {Error} If the database query fails.
 */
async function getUserByUsername(username) {
  try {
    const db = getDb();
    const user = await db.get(
      `SELECT * FROM users WHERE username = ?`,
      [username]
    );
    return user || null;
  } catch (error) {
    console.error('Error fetching user by username:', error.message);
    throw error;
  }
}

/**
 * Inserts or updates a user in the database.
 * 
 * @param {number} telegramId - The Telegram ID of the user.
 * @param {string} username - The username of the user.
 * @param {string} [role='user'] - The role of the user.
 * @throws {Error} If the database query fails.
 */
async function upsertUser(telegramId, username, role = 'user') {
  try {
    const db = getDb();
    await db.run(
      `INSERT INTO users (telegram_id, username, role) VALUES (?, ?, ?)
       ON CONFLICT(telegram_id) DO UPDATE SET username = excluded.username, role = excluded.role`,
      [telegramId, username, role]
    );
  } catch (error) {
    console.error('Error upserting user:', error.message);
    throw error;
  }
}

/**
 * Deletes a user from the database.
 * 
 * @param {number} telegramId - The Telegram ID of the user.
 * @throws {Error} If the database query fails.
 */
async function deleteUser(telegramId) {
  try {
    const db = getDb();
    await db.run(`DELETE FROM users WHERE telegram_id = ?`, [telegramId]);
  } catch (error) {
    console.error('Error deleting user:', error.message);
    throw error;
  }
}

module.exports = {
  getUserRole,
  getUser,
  getUserByUsername,
  upsertUser,
  deleteUser,
};