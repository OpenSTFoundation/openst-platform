
//All Module Requires.
const fs    = require('fs')
;

//All the requires.
const rootPrefix    = '..',
    coreConstants   = require( rootPrefix + '/config/core_constants' ),
    logFolder       = coreConstants.OST_TRANSACTION_LOGS_FOLDER,
    logger          = require( rootPrefix + '/helpers/custom_console_logger' ),
    responseHelper = require( rootPrefix+'/lib/formatter/response')
;

const TransactionLogger = module.exports = function ( transactionParams, memberSymbol ) {

  this.transactionParams = transactionParams;

  // how can we raise here if transactionUUID is missing in params
  this.filePath = getLogFilePath(memberSymbol, transactionParams.transactionUUID);

  this.logStep('Transaction Started With Params');
  this.logStep(this.transactionParams);

};

TransactionLogger.getTransactionLogs = function(memberSymbol, transactionUUID, callback) {

  const filePath = getLogFilePath(memberSymbol, transactionUUID);

  fs.readFile(filePath, 'utf8', (err, data) => {
    var response = null;
    if (err) {
      logger.error('error reading filePath: ', filePath, 'error : ', err);
      response =  responseHelper.error('h_tl_1', err)
      }
    else {
      logger.info(data);
      var dataCopy = data;
      dataCopy = dataCopy.replace(/\r/gm , "");
      var stringLogs = dataCopy.split(/\n/);
      var logs = [];
      var unprocessedLogs = [];
      stringLogs.forEach( function ( log ) {
        return logProcessor( log, logs, unprocessedLogs);
      });

      var returnObj = {
        'logs' : logs
      };
      if ( unprocessedLogs.length ) {
        returnObj[ "unprocessed" ] = unprocessedLogs;
      }
      response =  responseHelper.successWithData( returnObj );
    }
    callback && callback(response);
  });

};

const logProcessor = function ( log, logs, unprocessedLogs ) {
  if ( !log.length ) {
    return;
  }
  try {
    var joLog = JSON.parse( log );
    logs.push( joLog );
    var strData = joLog.data;
    try {
      joLog.data = JSON.parse( strData );
    } catch (ex ) {
      //Ignore it. The data can be string.
    }
  } catch( ex ) {
    unprocessedLogs.push( log );
    logger.error("TransactionLogger :: getTransactionLogs :: failed to decode log. log:", log);
    logger.error( ex );
  }
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
      var formattedLine = oThis.formatLineforLogFile(arg, time, logLevel);
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

  formatLineforLogFile: function(data, time, logLevel) {
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

const getLogFilePath = function (memberSymbol, transactionUUID) {
  return logFolder + memberSymbol + '-' + transactionUUID + '.json';
}