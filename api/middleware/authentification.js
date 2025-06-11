module.exports = (request, response, next) => {
  
  /**
   * Import the configuration file to access the API password
   */
  const config = require('../config');

  try {
      /**
       * Retrieve the password from the request body or URL parameters
       */
      const pass = request.body.password || request.params.apipassword;

      /**
       * Check if the API password is set in the configuration
       */
      if (config.apipassword == '') error('Your API Password is not set, look at your config file.', 401);
      
      /**
       * Validate the provided password
       */
      switch (pass) {
          case ' ':
              error('The password you sent is empty.', 401);
              break;
          case undefined:
              error('Please send the API password.', 401);
              break;
          case config.apipassword:
              /**
               * If the password is correct, proceed to the next middleware
               */
              next();
              break;
          default:
              /**
               * If the password is incorrect, return an error
               */
              error('Invalid password.', 401);
              break;
      }

  } catch {
      /**
       * Handle any unexpected errors
       */
      response.status(401).json({
          error: 'Invalid request!'
      });
  }

  /**
   * Helper function to send an error response
   * @param {string} msg - The error message
   * @param {number} statuscode - The HTTP status code
   */
  function error(msg, statuscode) {
      response.status(statuscode).json({
          error: msg
      });
  }
};