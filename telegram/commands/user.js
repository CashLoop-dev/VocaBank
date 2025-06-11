/**
 * Command to manage users (add, delete, promote, fetch info).
 * This command allows admins to perform user-related operations via a guided session.
 */

const { Composer } = require('grammy');
const { upsertUser, deleteUser, getUser, getUserByUsername } = require('../utils/utils');
const onlyAdmin = require('../middleware/onlyAdmin');

const userCommand = new Composer();

/**
 * Command: /user
 * Starts a user management session and prompts the admin for an action.
 */
userCommand.command('user', onlyAdmin, async (ctx) => {
  ctx.session.userSession = { step: 'command' }; // Initialize session
  return ctx.reply(
    'What would you like to do?\nOptions:\n1. Add User\n2. Set Admin\n3. Delete User\n4. Get User Info\n\nReply with the number of your choice:'
  );
});

/**
 * Command: /canceluser
 * Cancels an active user management session.
 */
userCommand.command('canceluser', async (ctx) => {
  if (ctx.session.userSession) {
    ctx.session.userSession = null; // Clear session
    return ctx.reply('❌ User session canceled.');
  }
  return ctx.reply('ℹ️ No active user session found.');
});

/**
 * Middleware: Handles user management actions based on the session state.
 * Supports adding, promoting, deleting, and fetching user information.
 */
userCommand.on('message', async (ctx, next) => {
  const session = ctx.session.userSession;
  if (!session) return next(); // No active user session, pass to next middleware

  const text = ctx.message.text.trim();

  switch (session.step) {
    case 'command':
      // Determine the action based on user input
      if (text === '1') {
        session.action = 'add';
        session.step = 'username';
        return ctx.reply('Please enter the username to add (e.g., @username):');
      } else if (text === '2') {
        session.action = 'setadmin';
        session.step = 'username';
        return ctx.reply('Please enter the username to promote to admin (e.g., @username):');
      } else if (text === '3') {
        session.action = 'delete';
        session.step = 'username';
        return ctx.reply('Please enter the username to delete (e.g., @username):');
      } else if (text === '4') {
        session.action = 'info';
        session.step = 'username';
        return ctx.reply('Please enter the username to fetch info (e.g., @username), or type "me" to fetch your own info:');
      } else {
        return ctx.reply('Invalid choice. Please reply with a number between 1 and 4.');
      }

    case 'username':
      // Handle username input for different actions
      if (session.action === 'info' && text.toLowerCase() === 'me') {
        const userInfo = await getUser(ctx.from.id);
        ctx.session.userSession = null; // Clear session
        return ctx.reply(userInfo ? `ℹ️ Info for you:\nRole: ${userInfo.role}\nTelegram ID: ${userInfo.telegram_id}` : '⚠️ Your information was not found.');
      }

      if (!text.startsWith('@')) {
        return ctx.reply('❌ Invalid username. Please enter a valid username starting with @ (e.g., @username):');
      }
      session.username = text.replace('@', '');

      if (session.action === 'add') {
        session.step = 'telegram_id';
        return ctx.reply('Please enter the Telegram ID of the user:');
      } else if (session.action === 'setadmin') {
        const userToPromote = await getUserByUsername(session.username);
        if (!userToPromote) {
          ctx.session.userSession = null; // Clear session
          return ctx.reply(`⚠️ User @${session.username} not found.`);
        }
        await upsertUser(userToPromote.telegram_id, session.username, 'admin');
        ctx.session.userSession = null; // Clear session
        return ctx.reply(`✅ User @${session.username} promoted to 'admin'.`);
      } else if (session.action === 'delete') {
        const userToDelete = await getUserByUsername(session.username);
        if (!userToDelete) {
          ctx.session.userSession = null; // Clear session
          return ctx.reply(`⚠️ User @${session.username} not found.`);
        }
        await deleteUser(userToDelete.telegram_id);
        ctx.session.userSession = null; // Clear session
        return ctx.reply(`✅ User @${session.username} deleted successfully.`);
      } else if (session.action === 'info') {
        const userInfo = await getUserByUsername(session.username);
        ctx.session.userSession = null; // Clear session
        return ctx.reply(userInfo ? `ℹ️ Info for @${session.username}\nRole: ${userInfo.role}\nTelegram ID: ${userInfo.telegram_id}` : `⚠️ User @${session.username} not found.`);
      }
      break;

    case 'telegram_id':
      // Handle Telegram ID input for adding a user
      if (!text.match(/^\d+$/)) {
        return ctx.reply('❌ Invalid Telegram ID. Please enter a valid numeric Telegram ID:');
      }
      session.telegram_id = parseInt(text, 10);

      try {
        await upsertUser(session.telegram_id, session.username, 'user');
        ctx.session.userSession = null; // Clear session
        return ctx.reply(`✅ User @${session.username} added successfully.`);
      } catch (error) {
        console.error('❌ Error adding user:', error.message);
        ctx.session.userSession = null; // Clear session
        return ctx.reply('⚠️ Failed to add user. Please try again.');
      }

    default:
      ctx.session.userSession = null; // Clear session
      return ctx.reply('⚠️ Something went wrong. Please start over.');
  }
});

module.exports = userCommand;
