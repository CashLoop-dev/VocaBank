/**
 * Stream route handler for serving audio files
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const sqlite3 = require('sqlite3').verbose();

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, '../db/database.db'));

/**
 * Stream handler for audio files
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const streamHandler = (req, res) => {
  const service = req.params.service;
  let filePath;

  // Check if this is a custom script request
  if (service.startsWith('script_')) {
    const scriptName = service.replace('script_', '');
    
    // Get script from database
    db.get('SELECT * FROM scripts WHERE name = ?', [scriptName], (err, row) => {
      if (err || !row || !row.audio_path) {
        console.error('Error retrieving script:', err || 'Script not found');
        return res.status(404).send('Script not found');
      }
      
      const fullPath = path.join(__dirname, '..', row.audio_path);
      
      if (!fs.existsSync(fullPath)) {
        console.error(`Audio file not found: ${fullPath}`);
        return res.status(404).send('Audio file not found');
      }
      
      // Stream the audio file
      const stat = fs.statSync(fullPath);
      const fileSize = stat.size;
      const range = req.headers.range;
      
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(fullPath, { start, end });
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/mpeg'
        });
        
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'audio/mpeg'
        });
        
        fs.createReadStream(fullPath).pipe(res);
      }
    });
    
    return;
  }

  // Handle standard service audio files
  switch (service) {
    case 'amazon':
      filePath = config.amazonfilepath;
      break;
    case 'cdiscount':
      filePath = config.cdiscountfilepath;
      break;
    case 'twitter':
      filePath = config.twitterfilepath;
      break;
    case 'whatsapp':
      filePath = config.whatsappfilepath;
      break;
    case 'paypal':
      filePath = config.paypalfilepath;
      break;
    case 'google':
      filePath = config.googlefilepath;
      break;
    case 'snapchat':
      filePath = config.snapchatfilepath;
      break;
    case 'instagram':
      filePath = config.instagramfilepath;
      break;
    case 'facebook':
      filePath = config.facebookfilepath;
      break;
    case 'end':
      filePath = config.endfilepath;
      break;
    case 'banque':
      filePath = config.banquefilepath;
      break;
    default:
      // Check if the service name matches any custom script in config
      const scriptKey = `${service.toLowerCase()}filepath`;
      if (config[scriptKey]) {
        filePath = config[scriptKey];
      } else {
        filePath = config.defaultfilepath;
      }
      break;
  }

  // Check if file exists
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Audio file not found: ${fullPath}`);
    return res.status(404).send('Audio file not found');
  }

  // Stream the audio file
  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(fullPath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg'
    });
    
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg'
    });
    
    fs.createReadStream(fullPath).pipe(res);
  }
};

module.exports = streamHandler;
