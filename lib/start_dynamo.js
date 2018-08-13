'use strict';

/*
 * Start Dynamodb Service
 */

const shellAsyncCmd = require('node-cmd');

const rootPrefix = '..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

const StartDynamoKlass = function() {
  const oThis = this;
};

StartDynamoKlass.prototype = {
  /**
   *
   * Perform
   *
   * @return {Promise}
   *
   */
  perform: function() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::perform::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_sd_1',
          api_error_identifier: 'unhandled_catch_response',
          debug_options: {}
        });
      }
    });
  },

  /**
   * asyncPerform
   *
   * @return {Promise}
   */
  asyncPerform: async function() {
    const oThis = this;

    // Start Dynamo DB in openST env
    logger.step('** Start Dynamo DB');
    let cmd =
      'nohup java -Djava.library.path=~/dynamodb_local_latest/DynamoDBLocal_lib/ -jar ~/dynamodb_local_latest/DynamoDBLocal.jar -sharedDb -dbPath ~/openst-setup/logs/ &';
    shellAsyncCmd.run(cmd);
  }
};

module.exports = StartDynamoKlass;
