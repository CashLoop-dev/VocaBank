var app = require('./app');
var config = require('./config');
var http = require('http');

/**
 * HTTP web server side launching the EXPRESS part
 */
var server = http.createServer(app);
server.listen(config.port || 80, function() {
    console.log('Express server started on *:' + config.port);
});