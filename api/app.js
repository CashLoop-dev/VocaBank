/**
 * Integration of dependencies
 */
const express = require('express');
const morgan = require('morgan');
const setup = require('./setup');
const config = require('./config');

/**
 * Integration of routes stored in /routes
 */
const voice = require('./routes/voice');
const status = require('./routes/status');
const call = require('./routes/call');
const sms = require('./routes/sms');
const get = require('./routes/get');
const stream = require('./routes/stream');

/**
 * Adding authentication middleware => verifies if the API is being used with a password
 */
const auth = require('./middleware/authentification');

if (config.setupdone == 'false') setup();

/**
 * Express part on the web server side
 */
var app = express();
app.use(express.urlencoded({
    extended: true
}));
// app.use(morgan('combined')); // Only used for debugging HTTP requests

app.post('/voice/:apipassword', auth, voice);
app.post('/status/:apipassword', auth, status);
app.post('/call', auth, call);
app.post('/sms', auth, sms);
app.post('/get', auth, get);
app.get('/stream/:service', stream);

app.use(function(req, res) {
    res.status(404).json({
        error: 'Not found, or bad request method.'
    });
});

module.exports = app;