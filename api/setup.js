/**
 * Setup script for initializing the API
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

/**
 * Initialize the API setup
 */
const setup = () => {
  console.log('Starting API setup...');
  
  // Create necessary directories
  createDirectories();
  
  // Initialize database
  initializeDatabase();
  
  console.log('API setup completed successfully.');
};

/**
 * Create necessary directories for the API
 */
const createDirectories = () => {
  console.log('Creating necessary directories...');
  
  // Create db directory
  const dbDir = path.join(__dirname, 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created db directory');
  }
  
  // Create voice directories
  const voiceDir = path.join(__dirname, 'voice');
  if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
    console.log('Created voice directory');
  }
  
  // Create language directories
  const enDir = path.join(voiceDir, 'en');
  if (!fs.existsSync(enDir)) {
    fs.mkdirSync(enDir, { recursive: true });
    console.log('Created voice/en directory');
  }
  
  const frDir = path.join(voiceDir, 'fr');
  if (!fs.existsSync(frDir)) {
    fs.mkdirSync(frDir, { recursive: true });
    console.log('Created voice/fr directory');
  }
  
  // Create service directories in en
  const services = ['amazon', 'cdiscount', 'twitter', 'whatsapp', 'paypal', 'google', 'snapchat', 'instagram', 'facebook', 'done', 'default', 'banque'];
  
  services.forEach(service => {
    const serviceDir = path.join(enDir, service);
    if (!fs.existsSync(serviceDir)) {
      fs.mkdirSync(serviceDir, { recursive: true });
      console.log(`Created voice/en/${service} directory`);
    }
  });
  
  // Create scripts directory
  const scriptsDir = path.join(voiceDir, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
    console.log('Created voice/scripts directory');
  }
};

/**
 * Initialize the database
 */
const initializeDatabase = () => {
  console.log('Initializing database...');
  
  const db = new sqlite3.Database(path.join(__dirname, 'db/database.db'));
  
  db.serialize(() => {
    // Create calls table
    db.run(`CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sid TEXT UNIQUE,
      to_number TEXT,
      service TEXT,
      status TEXT,
      code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('Created calls table');
    
    // Create sms table
    db.run(`CREATE TABLE IF NOT EXISTS sms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sid TEXT UNIQUE,
      to_number TEXT,
      service TEXT,
      status TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('Created sms table');
    
    // Create scripts table
    db.run(`CREATE TABLE IF NOT EXISTS scripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      type TEXT,
      message TEXT,
      audio_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('Created scripts table');
  });
  
  db.close();
};

module.exports = setup;
