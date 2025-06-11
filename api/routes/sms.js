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
   * Retrieving the posted variables to order the call
   */
  var to = request.body.to || null;
  var user = request.body.user || null;
  var service = request.body.service + 'sms';

  /**
   * If any variable is missing, transmit the error and prevent the system from functioning
   */
  if (to == null || user == null || service == null) {
      response.status(200).json({
          error: 'Please post all the informations needed.'
      });
      return false;
  }

  /**
   * If the service file location is not found, it means the service is not supported, and an error is returned
   */
  if (config[service] == undefined) {
      response.status(200).json({
          error: 'The service wasn\'t recognised.'
      });
      return false;
  }

  /**
   * If the phone number is correct, then initiate the call
   */
  if (to.match(/^\d{8,14}$/g) && !!user && !!service) {
      /**
       * Twilio API to send the SMS
       */
      client.messages.create({
          body: config[service],
          from: config.callerid,
          statusCallback: config.serverurl + '/status/' + config.apipassword,
          to: '+' + to
      }).then((message) => {
          smssid = message.sid;

          response.status(200).json({
              smssid
          });
          response.send(smssid);

          /**
           * Add the sent SMS to the Sqlite3 database
           */
          db.run(`INSERT INTO sms(smssid, user, itsfrom, itsto, content,  service, date) VALUES(?, ?, ?, ?, ?, ?, ?)`, [smssid, user, config.callerid, to, config[service], service, Date.now()], function(err) {
              if (err) {
                  return console.log(err.message);
              }
          });
      });
  } else {
      response.status(200).json({
          error: 'Bad phone number or username or service.'
      });
  }
};