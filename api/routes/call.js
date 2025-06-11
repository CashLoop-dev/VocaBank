module.exports = function(request, response) {
    /**
     * Integration of SQLITE3 dependencies
     */
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./db/data.db');

    /**
     * File containing the necessary configurations for the proper functioning of the system
     */
    const config = require('../config');

    /**
     * Twilio identification and declaration
     */
    const client = require('twilio')(config.accountSid, config.authToken);

    /**
     * Retrieving the posted variables required to initiate the call
     */
    var to = request.body.to || null;
    var user = request.body.user || null;
    var service = request.body.service || null;
    var name = request.body.name || null;
    var callSid = null;

    /**
     * If any of the variables are missing, return an error and prevent the system from functioning
     */
    if (to == null || user == null || service == null) {
        return response.status(200).json({
            error: 'Please post all the information needed.'
        });
    }

    /**
     * If the service file path is not found, it means the service is not supported, and an error is returned
     */
    if (config[service + 'filepath'] == undefined) {
        return response.status(200).json({
            error: "The service wasn't recognized."
        });
    }

    if (!!!user) {
        return response.status(200).json({
            error: "Bad user name."
        });
    }

    if (!!!service) {
        return response.status(200).json({
            error: "Bad service name."
        });
    }

    /**
     * If the phone number is valid, initiate the call
     */
    if (!to.match(/^\d{8,14}$/g)) {
        return response.status(200).json({
            error: 'Bad phone number.'
        });
    }

    /**
     * Twilio API to make the call
     */
    client.calls.create({
        method: 'POST',
        statusCallbackEvent: ['initiated', 'answered', 'completed'],
        statusCallback: config.serverurl + '/status/' + config.apipassword,
        url: config.serverurl + '/voice/' + config.apipassword,
        to: to,
        from: config.callerid
    }).then((call) => {
        callSid = call.sid;

        /**
         * Add the initiated call to the Sqlite3 database
         */
        db.get('SELECT callSid FROM calls WHERE callSid = ?', [callSid], (err, row) => {
            if (err) {
                return console.log(err.message);
            }

            /**
             * If the call has not already been recorded (verification using callSid => unique call identifier), then record it
             */
            if (row == undefined) {
                db.run(`INSERT INTO calls(callSid, user, service, itsto, name) VALUES(?, ?, ?, ?, ?)`, [callSid, user, service, to, name], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }
                });
            } else {
                db.run(`UPDATE calls SET user = ?, service = ?, itsto = ?, name = ?  WHERE callSid = ?`, [user, service, to, callSid, name], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }
                });
            }
        });

        response.status(200).json({
            callSid
        });
    }).catch(error => {
        return response.status(200).json({
            error: 'There was a problem with your call, check if your account is upgraded. ' + error
        });
    });

};
