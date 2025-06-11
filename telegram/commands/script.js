/**
 * Script command handler for creating and managing custom scripts
 */

const { Composer } = require('grammy');
const axios = require('axios');
const config = require('../config');
const { getDb } = require('../setup');

const composer = new Composer();

// Command to create a new script
composer.command('script', async (ctx) => {
  try {
    // Check if user is authorized
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [ctx.from.id]);
    
    if (!user || user.role !== 'admin') {
      return ctx.reply('⛔ You are not authorized to use this command.');
    }
    
    // Initialize script creation session
    ctx.session.scriptSession = {
      step: 'name',
      data: {}
    };
    
    return ctx.reply('📝 Let\'s create a new script. First, send me the script name:');
  } catch (error) {
    console.error('Error in script command:', error);
    return ctx.reply('❌ An error occurred while processing your request.');
  }
});

// Handle script creation flow
composer.on('message', async (ctx, next) => {
  if (!ctx.session.scriptSession) {
    return next();
  }
  
  const { step, data } = ctx.session.scriptSession;
  
  try {
    if (step === 'name') {
      // Save script name
      data.name = ctx.message.text.trim();
      ctx.session.scriptSession.step = 'type';
      return ctx.reply('Select script type:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Call Script', callback_data: 'script_type_call' }],
            [{ text: 'SMS Script', callback_data: 'script_type_sms' }]
          ]
        }
      });
    } else if (step === 'message') {
      // Save script message
      data.message = ctx.message.text;
      ctx.session.scriptSession.step = 'confirm';
      
      let confirmMessage = `📋 Script Summary:\n\nName: ${data.name}\nType: ${data.type}\nMessage:\n${data.message}`;
      
      return ctx.reply(confirmMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Confirm', callback_data: 'script_confirm' }],
            [{ text: '❌ Cancel', callback_data: 'script_cancel' }]
          ]
        }
      });
    }
  } catch (error) {
    console.error('Error in script creation flow:', error);
    ctx.session.scriptSession = null;
    return ctx.reply('❌ An error occurred while creating your script.');
  }
  
  return next();
});

// Handle callback queries for script creation
composer.on('callback_query', async (ctx) => {
  if (!ctx.session.scriptSession) return;
  
  const callbackData = ctx.callbackQuery.data;
  
  try {
    if (callbackData === 'script_type_call') {
      ctx.session.scriptSession.data.type = 'call';
      ctx.session.scriptSession.step = 'message';
      await ctx.answerCallbackQuery();
      return ctx.reply('📝 Now send me the script message for the call:');
    } else if (callbackData === 'script_type_sms') {
      ctx.session.scriptSession.data.type = 'sms';
      ctx.session.scriptSession.step = 'message';
      await ctx.answerCallbackQuery();
      return ctx.reply('📝 Now send me the script message for the SMS:');
    } else if (callbackData === 'script_confirm') {
      const { data } = ctx.session.scriptSession;
      
      // Send script data to API
      try {
        const response = await axios.post(`${config.apiUrl}/script`, {
          name: data.name,
          type: data.type,
          message: data.message,
          password: config.apiPassword
        });
        
        ctx.session.scriptSession = null;
        await ctx.answerCallbackQuery();
        
        if (response.data.success) {
          return ctx.reply(`✅ Script "${data.name}" created successfully!`);
        } else {
          return ctx.reply(`❌ Failed to create script: ${response.data.error}`);
        }
      } catch (error) {
        console.error('API error:', error.response?.data || error.message);
        await ctx.answerCallbackQuery();
        return ctx.reply(`❌ API Error: ${error.response?.data?.error || 'Unknown error'}`);
      }
    } else if (callbackData === 'script_cancel') {
      ctx.session.scriptSession = null;
      await ctx.answerCallbackQuery();
      return ctx.reply('❌ Script creation cancelled.');
    }
  } catch (error) {
    console.error('Error in script callback:', error);
    ctx.session.scriptSession = null;
    await ctx.answerCallbackQuery();
    return ctx.reply('❌ An error occurred while processing your request.');
  }
});

// Command to list all scripts
composer.command('scripts', async (ctx) => {
  try {
    // Check if user is authorized
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [ctx.from.id]);
    
    if (!user || user.role !== 'admin') {
      return ctx.reply('⛔ You are not authorized to use this command.');
    }
    
    try {
      const response = await axios.post(`${config.apiUrl}/scripts`, {
        password: config.apiPassword
      });
      
      if (!response.data.scripts || response.data.scripts.length === 0) {
        return ctx.reply('No scripts found.');
      }
      
      const scriptsList = response.data.scripts.map(script => 
        `- ${script.name} (${script.type})`
      ).join('\n');
      
      return ctx.reply(`📜 Available Scripts:\n\n${scriptsList}`);
    } catch (error) {
      console.error('API error:', error.response?.data || error.message);
      return ctx.reply(`❌ API Error: ${error.response?.data?.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error in scripts command:', error);
    return ctx.reply('❌ An error occurred while fetching scripts.');
  }
});

// Command to delete a script
composer.command('deletescript', async (ctx) => {
  try {
    // Check if user is authorized
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [ctx.from.id]);
    
    if (!user || user.role !== 'admin') {
      return ctx.reply('⛔ You are not authorized to use this command.');
    }
    
    const scriptName = ctx.message.text.split(' ').slice(1).join(' ').trim();
    
    if (!scriptName) {
      return ctx.reply('❌ Please provide a script name to delete. Usage: /deletescript [script_name]');
    }
    
    try {
      const response = await axios.post(`${config.apiUrl}/script/delete`, {
        name: scriptName,
        password: config.apiPassword
      });
      
      if (response.data.success) {
        return ctx.reply(`✅ Script "${scriptName}" deleted successfully!`);
      } else {
        return ctx.reply(`❌ Failed to delete script: ${response.data.error}`);
      }
    } catch (error) {
      console.error('API error:', error.response?.data || error.message);
      return ctx.reply(`❌ API Error: ${error.response?.data?.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error in deletescript command:', error);
    return ctx.reply('❌ An error occurred while deleting the script.');
  }
});

module.exports = composer;
