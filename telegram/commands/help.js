/**
 * Command to display help information.
 * This command provides a list of available commands and supported call services.
 */

const { Composer } = require('grammy');
const axios = require('axios');
const config = require('../config');

const helpCommand = new Composer();

// List of supported call services
const callServices = [
    'Google',
    'Snapchat',
    'Instagram',
    'Facebook',
    'WhatsApp',
    'Twitter',
    'Amazon',
    'Cdiscount',
    'Default: works for all systems',
    'Bank: bypass 3D Secure',
];

/**
 * Generates the help message with available commands and supported services.
 * 
 * @param {Array} customScripts - Array of custom script names
 * @returns {string} The formatted help message.
 */
const generateHelpMessage = async () => {
    let customScripts = [];
    
    // Try to fetch custom scripts from API
    try {
        const response = await axios.post(`${config.apiUrl}/scripts`, {
            password: config.apiPassword
        });
        
        if (response.data.success && response.data.scripts) {
            // Filter call scripts only
            customScripts = response.data.scripts
                .filter(script => script.type === 'call')
                .map(script => script.name);
        }
    } catch (error) {
        console.error('Error fetching scripts for help command:', error);
    }
    
    let helpMessage = `
<b>Help, Commands & Information</b>

<b>Description: All the Admin Commands</b>
/user add @user - Allow someone to use the bot & the calls
/user delete @user - Remove someone or an admin from the bot
/user info @user - Get info from a user
/user setadmin @user - Set a user to admin
/cancelcall - Cancel the call
/canceluser - Cancel the user command
/user me - Get your own info
/script - Create a new custom script
/scripts - List all available scripts
/deletescript [name] - Delete a script

<b>All the User Commands:</b>
/call phonenumber service (e.g., /call 33612345678 paypal) - Allows you to make a call to the phone number and get the code

<b>The Different Call Services Supported:</b>
${callServices.map((service, index) => `${index + 1}. ${service}`).join('\n')}`;

    // Add custom scripts to the help message if any exist
    if (customScripts.length > 0) {
        helpMessage += `

<b>Custom Scripts Available:</b>
${customScripts.map((script, index) => `${index + 1}. ${script}`).join('\n')}`;
    }
    
    return helpMessage;
};

/**
 * Command: /help
 * Sends the help message to the user.
 */
helpCommand.command('help', async (ctx) => {
    try {
        const helpMessage = await generateHelpMessage();
        await ctx.reply(helpMessage, { parse_mode: 'HTML' });
    } catch (error) {
        console.error('❌ Error sending help message:', error);
        await ctx.reply('An error occurred while fetching the help message. Please try again later.');
    }
});

module.exports = helpCommand;
