// middleware/onlyAdmin.js

/**
 * Middleware to restrict access to admin users.
 * This middleware checks the role of the user and ensures only admins can proceed.
 */

const { getUserRole } = require('../utils/utils');

/**
 * Middleware function to restrict access to admin users.
 * 
 * @param {Object} ctx - The Telegram context object.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>} Resolves if the user is an admin, otherwise sends an error message.
 */
async function onlyAdmin(ctx, next) {
  try {
    const senderId = ctx.from.id; // Get the sender's Telegram ID
    const role = await getUserRole(senderId); // Fetch the user's role

    if (role !== 'admin') {
      return ctx.reply('⚠️ You are not authorized to perform this action.');
    }

    return next(); // Proceed to the next middleware
  } catch (error) {
    console.error('❌ Error in onlyAdmin middleware:', error.message);
    return ctx.reply('⚠️ An error occurred while checking your permissions.');
  }
}

module.exports = onlyAdmin;