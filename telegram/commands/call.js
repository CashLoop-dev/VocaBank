// telegram/commands/call.js

const { Composer } = require('grammy');
const axios = require('axios');
const qs = require('qs');
const config = require('../config');
const onlyAdmin = require('../middleware/onlyAdmin');

const callCommand = new Composer();

/**
 * Admin-only command to begin a new phone call session.
 */
callCommand.command('call', onlyAdmin, async (ctx) => {
  ctx.session.callSession = { step: 'phone' }; // Begin multi-step input flow
  return ctx.reply('📞 Please provide the client phone number to call (e.g., 33612345678):');
});

/**
 * Cancel an active call session if one exists.
 */
callCommand.command('cancelcall', async (ctx) => {
  if (ctx.session.callSession) {
    ctx.session.callSession = null; // Clear in-progress session
    return ctx.reply('❌ Call session canceled.');
  }
  return ctx.reply('ℹ️ No active call session found.');
});

/**
 * Multi-step form handler for the /call command.
 * Steps: phone → service → name → trigger call
 */
callCommand.on('message:text', async (ctx, next) => {
  const session = ctx.session.callSession;
  if (!session) return next(); // Skip if no active call session

  const text = ctx.message.text.trim();

  switch (session.step) {
    case 'phone':
      // Validate numeric phone format (8-14 digits)
      if (!/^\d{8,14}$/.test(text)) {
        return ctx.reply('❌ Invalid phone number. Please enter a valid number (e.g., 33612345678):');
      }
      session.phone = text;
      session.step = 'service';
      return ctx.reply('🏦 Please enter the service name (e.g., paypal):');

    case 'service':
      // Accept alphabetic service name only
      if (!/^[a-zA-Z]+$/.test(text)) {
        return ctx.reply('❌ Invalid service name. Use alphabetic characters only (e.g., PayPal):');
      }
      session.service = text;
      session.step = 'name';
      return ctx.reply('📇 Enter the client name (or type "none" if not applicable):');

    case 'name':
      // Accept "none" as null value
      session.name = text.toLowerCase() === 'none' ? null : text;

      try {
        // Construct and send API call payload
        const payload = {
          password: config.apiPassword,
          to: session.phone,
          user: ctx.from.username || 'unknown',
          service: session.service,
          name: session.name,
        };

        await axios.post(`${config.apiUrl}/call/`, qs.stringify(payload));

        // Step 1: Confirmation message of call request details
        await ctx.reply(
          `📲 Phone: ${session.phone}\n🏦 Service: ${session.service}\n📇 Name: ${session.name || 'N/A'}`
        );

        // Step 2 & 3: Delayed simulated progression of call status
        const chatId = ctx.chat.id;

        // Delay to simulate calling phase (isolated per chat session)
        setTimeout(() => {
          ctx.api.sendMessage(chatId, '*✅ Calling...*', { parse_mode: 'Markdown' });
        }, 1000);

        // Further delay to simulate ringing phase
        setTimeout(() => {
          ctx.api.sendMessage(chatId, '*☎️ Ringing...*', { parse_mode: 'Markdown' });
        }, 2000);
      } catch (err) {
        // Catch network/API issues and notify
        console.error('❌ API call error:', err.message);
        await ctx.reply('⚠️ Failed to send call request. Please check the service or API.');
      }

      ctx.session.callSession = null; // Always reset session after completion
      break;

    default:
      ctx.session.callSession = null; // Reset on unexpected state
      return ctx.reply('⚠️ Unknown session step. Please restart using /call.');
  }
});

module.exports = callCommand;
