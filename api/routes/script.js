const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

// Initialize database
const dbPath = path.join(__dirname, '../db/database.db');
const dbDir = path.dirname(dbPath);

// Create db directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Create scripts table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    type TEXT,
    message TEXT,
    audio_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

/**
 * Create a new script
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createScript = async (req, res) => {
  try {
    const { name, type, message } = req.body;
    
    if (!name || !type || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    if (type !== 'call' && type !== 'sms') {
      return res.status(400).json({ success: false, error: 'Invalid script type' });
    }
    
    // Check if script name already exists
    db.get('SELECT * FROM scripts WHERE name = ?', [name], async (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, error: 'Database error' });
      }
      
      if (row) {
        return res.status(400).json({ success: false, error: 'Script name already exists' });
      }
      
      let audioPath = null;
      
      // For call scripts, generate audio using Eleven Labs API
      if (type === 'call' && config.elevenLabsApiKey) {
        try {
          // Create voice directory structure: voice/en/scriptname/
          const scriptDir = path.join(__dirname, '../voice/en', name);
          if (!fs.existsSync(scriptDir)) {
            fs.mkdirSync(scriptDir, { recursive: true });
          }
          
          // Generate audio file using Eleven Labs API
          const audioResponse = await axios({
            method: 'POST',
            url: 'https://api.elevenlabs.io/v1/text-to-speech/' + config.elevenLabsVoiceId,
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': config.elevenLabsApiKey
            },
            data: {
              text: message,
              model_id: 'eleven_monolingual_v1',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
              }
            },
            responseType: 'arraybuffer'
          });
          
          // Save audio file with the specific naming convention
          const fileName = `ask-${name}.mp3`;
          audioPath = `voice/en/${name}/${fileName}`;
          const fullPath = path.join(__dirname, '..', audioPath);
          
          fs.writeFileSync(fullPath, audioResponse.data);
          console.log(`Audio file created at: ${fullPath}`);
          
          // Update config with the new script path
          // This is done by adding a new entry to process.env
          const configKey = `${name.toUpperCase()}_FILE_PATH`;
          process.env[configKey] = `./${audioPath}`;
          
          // Add the new path to the config object
          config[`${name.toLowerCase()}filepath`] = `./${audioPath}`;
        } catch (error) {
          console.error('Error generating audio:', error);
          return res.status(500).json({ success: false, error: 'Failed to generate audio' });
        }
      }
      
      // Save script to database
      db.run(
        'INSERT INTO scripts (name, type, message, audio_path) VALUES (?, ?, ?, ?)',
        [name, type, message, audioPath],
        function(err) {
          if (err) {
            console.error('Error saving script:', err);
            return res.status(500).json({ success: false, error: 'Failed to save script' });
          }
          
          // Update .env file with the new script path
          if (audioPath) {
            try {
              const envPath = path.join(__dirname, '../.env');
              const envContent = fs.readFileSync(envPath, 'utf8');
              const configKey = `${name.toUpperCase()}_FILE_PATH`;
              
              // Check if the key already exists in the .env file
              if (!envContent.includes(`${configKey}=`)) {
                const newEnvContent = envContent + `\n${configKey}=./${audioPath}`;
                fs.writeFileSync(envPath, newEnvContent);
                console.log(`Updated .env file with ${configKey}`);
              }
            } catch (error) {
              console.error('Error updating .env file:', error);
              // Continue even if .env update fails
            }
          }
          
          return res.json({
            success: true,
            script: {
              id: this.lastID,
              name,
              type,
              message,
              audio_path: audioPath
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Error creating script:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get all scripts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllScripts = (req, res) => {
  db.all('SELECT * FROM scripts ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    
    return res.json({ success: true, scripts: rows });
  });
};

/**
 * Get script by name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getScriptByName = (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, error: 'Script name is required' });
  }
  
  db.get('SELECT * FROM scripts WHERE name = ?', [name], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, error: 'Script not found' });
    }
    
    return res.json({ success: true, script: row });
  });
};

/**
 * Delete script
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteScript = (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, error: 'Script name is required' });
  }
  
  db.get('SELECT * FROM scripts WHERE name = ?', [name], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, error: 'Script not found' });
    }
    
    // Delete audio file if exists
    if (row.audio_path) {
      const fullPath = path.join(__dirname, '..', row.audio_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      
      // Try to remove directory if empty
      const dirPath = path.dirname(fullPath);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        if (files.length === 0) {
          fs.rmdirSync(dirPath);
        }
      }
      
      // Remove from config
      const configKey = `${name.toLowerCase()}filepath`;
      if (config[configKey]) {
        delete config[configKey];
      }
      
      // Update .env file to remove the script path
      try {
        const envPath = path.join(__dirname, '../.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const configKey = `${name.toUpperCase()}_FILE_PATH`;
        
        // Remove the line containing the script path
        const newEnvContent = envContent
          .split('\n')
          .filter(line => !line.startsWith(`${configKey}=`))
          .join('\n');
        
        fs.writeFileSync(envPath, newEnvContent);
        console.log(`Removed ${configKey} from .env file`);
      } catch (error) {
        console.error('Error updating .env file:', error);
        // Continue even if .env update fails
      }
    }
    
    // Delete from database
    db.run('DELETE FROM scripts WHERE name = ?', [name], function(err) {
      if (err) {
        console.error('Error deleting script:', err);
        return res.status(500).json({ success: false, error: 'Failed to delete script' });
      }
      
      return res.json({ success: true });
    });
  });
};

module.exports = {
  createScript,
  getAllScripts,
  getScriptByName,
  deleteScript
};
