module.exports = function(req, res) {
    /**
     * File containing the necessary configurations for the proper functioning of the system
     */
    const config = require('.././config');

    /**
     * Integration of FS dependencies to modify files
     */
    const fs = require('fs');

    /**
     * Create a variable storing the name of the service to fetch from the config file
     */
    const service = req.params.service + 'filepath';

    /**
     * If the service exists in the config file, continue
     */
    if (!!config[service] && config[service] != undefined) {
        /**
         * Retrieve the storage path of the audio file
         */
        const filePath = config[service];

        /**
         * Calculate the size of the audio file
         */
        var stat = fs.statSync(filePath);
        var total = stat.size;

        /**
         * Modify the header so the file can be used by Twilio
         */
        res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': 'audio/mpeg'
        });
        fs.createReadStream(filePath).pipe(res);
    } else {
        return res.status(200).json({
            error: 'Bad service.'
        });
    }
};