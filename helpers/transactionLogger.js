
//All Module Requires.
const fs    = require('fs')
;

//All the requires.
const rootPrefix    = '..',
    coreConstants   = require( rootPrefix + '/config/core_constants' ),
    logFolder       = coreConstants.OST_TRANSACTION_LOGS_FOLDER,
    logger          = require( rootPrefix + '/helpers/custom_console_logger' )
;

const TransactionLogger = module.exports = function ( transactionParams ) {

  this.transactionParams = transactionParams;

  // how can we raise here if transactionUUID is missing in params
  this.fileName = this.transactionParams.transactionUUID + '.json';
  this.filePath = logFolder + this.fileName;

  this.logStep('Transaction Started With Params');
  this.logStep(this.transactionParams);

};

TransactionLogger.prototype = {

  logWin: function () {
    logger.info(arguments);
    this.writeToFile(arguments, 'Win');
  },

  logStep: function () {
    logger.info(arguments);
    this.writeToFile(arguments, 'Step');
  },

  logInfo: function () {
    logger.info(arguments);
    this.writeToFile(arguments, 'Info');
  },

  logError: function () {
    logger.error(arguments);
    this.writeToFile(arguments, 'Error');
  },

  logWarning: function () {
    logger.error(arguments);
    this.writeToFile(arguments, 'Warn');
  },

  // how to make below methods private

  writeToFile: function (args, logLevel) {

    const oThis = this
        , time = oThis.currentTime();
    ;

    Object.values(args).forEach(function (arg) {
      var formattedLine = oThis.formatLine(arg, time, logLevel);
      fs.appendFile(oThis.filePath, formattedLine, (err) => {
        if (err) {
          logger.error("couldn't append to log file" + err);
        };
      });
    });

  },

  currentTime: function() {
    return new Date();
  },

  formatLine: function(data, time, logLevel) {
    if ( typeof data != 'string' ) {
       if ( data instanceof Object ) {
         data = JSON.stringify( data );
       } else {
         data = String( data );
       }
    }
    var buffer = {
      "time": time,
      "logLevel": logLevel,
      "data": data
    };
    return JSON.stringify(buffer) + '\n';
  }

}