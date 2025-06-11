/**
 * Call route handler for initiating calls
 */

const express = require('express');
const twilio = require('twilio');
const config = require('../config');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, '../db/database.db'));

/**
 * Call handler for initiating calls
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const callHandler = (req, res) => {
  try {
    // Extract parameters from request
    const { to, service, password, scriptName } = req.body;
    
    // Validate required parameters
    if (!to || (!service && !scriptName)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters. Need "to" and either "service" or "scriptName".'
      });
    }
    
    // Initialize Twilio client
    const client = twilio(config.accountSid, config.authToken);
    
    // Determine which service/script to use for the call
    let serviceToUse = service;
    let isCustomScript = false;
    
    // If scriptName is provided, check if it exists
    if (scriptName) {
      db.get('SELECT * FROM scripts WHERE name = ? AND type = ?', [scriptName, 'call'], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        if (!row) {
          return res.status(404).json({ success: false, error: 'Script not found or not a call script' });
        }
        
        // Use the script name as the service
        serviceToUse = scriptName;
        isCustomScript = true;
        
        // Make the call
        makeCall(client, to, serviceToUse, isCustomScript, res);
      });
    } else {
      // Use the provided service
      makeCall(client, to, serviceToUse, isCustomScript, res);
    }
  } catch (error) {
    console.error('Error in call handler:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Make a call using Twilio
 * @param {Object} client - Twilio client
 * @param {string} to - Phone number to call
 * @param {string} service - Service or script name to use
 * @param {boolean} isCustomScript - Whether this is a custom script
 * @param {Object} res - Express response object
 */
const makeCall = (client, to, service, isCustomScript, res) => {
  // Build the URL for the voice TwiML
  let voiceUrl;
  
  if (isCustomScript) {
    // For custom scripts, use script_[name] format
    voiceUrl = `${config.serverurl}/voice/${config.apipassword}?service=${service}`;
  } else {
    voiceUrl = `${config.serverurl}/voice/${config.apipassword}?service=${service}`;
  }
  
  // Make the call
  client.calls.create({
    url: voiceUrl,
    to: to,
    from: config.callerid
  }).then(call => {
    // Save call to database
    db.run(
      'INSERT INTO calls (sid, to_number, service, status) VALUES (?, ?, ?, ?)',
      [call.sid, to, service, call.status],
      function(err) {
        if (err) {
          console.error('Error saving call to database:', err);
        }
      }
    );
    
    return res.json({
      success: true,
      sid: call.sid,
      to: call.to,
      from: call.from,
      status: call.status
    });
  }).catch(error => {
    console.error('Error making call:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  });
};

module.exports = callHandler;
