
//All Module Requires.
const fs    = require('fs')
;

//All the requires.
const rootPrefix    = '..'
  , coreConstants   = require( rootPrefix + '/config/core_constants' )
  , logger          = require( rootPrefix + '/helpers/custom_console_logger' )
  , responseHelper  = require( rootPrefix + '/lib/formatter/response')
;

//All constants.
const logFolder = coreConstants.OST_TRANSACTION_LOGS_FOLDER
  , _pending = {}
  , _failed = {}  
;

//All internal methods
const getLogFilePath = function (memberSymbol, transactionUUID) {
  return logFolder + memberSymbol + '-' + transactionUUID + '.json';
}

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



//Constructor.
const TransactionLogger = module.exports = function ( transactionParams, memberSymbol ) {

  this.transactionParams = transactionParams;

  // how can we raise here if transactionUUID is missing in params
  this.filePath = getLogFilePath(memberSymbol, transactionParams.transactionUUID);

  this.logStep('Transaction Started With Params');
  this.logStep(this.transactionParams);

  this.markPending();

};


TransactionLogger.prototype = {

  logWin: function () {
    logger.win.apply(logger, arguments);
    this.writeToFile(arguments, 'WIN');
  },

  logStep: function () {
    logger.step.apply(logger, arguments);
    this.writeToFile(arguments, 'STEP');
  },

  logInfo: function () {
    logger.info.apply(logger, arguments);
    this.writeToFile(arguments, 'INFO');
  },

  logError: function () {
    logger.error.apply(logger, arguments);
    this.writeToFile(arguments, 'ERROR');
  },

  logWarning: function () {
    logger.warn.apply(logger, arguments);
    this.writeToFile(arguments, 'WARN');
  },

  _logComplete: function () {
    logger.info.apply(logger, arguments);
    this.writeToFile(arguments, 'COMPLETE');
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
  },

  markPending: function () {
    _pending[ this.transactionParams.transactionUUID ] = true;
  },

  markSuccess: function () {
    _pending[ this.transactionParams.transactionUUID ] = false;
    delete _pending[ this.transactionParams.transactionUUID ];
    this._logComplete("Transaction Success");
  },

  markFailed: function () {
    _failed[ this.transactionParams.transactionUUID ] = true;
    _pending[ this.transactionParams.transactionUUID ] = false;
    delete _pending[ this.transactionParams.transactionUUID ];
    this._logComplete("Transaction Failed");
  }
}

//All Static Methods. Note: Static methods can not be called on instance.
TransactionLogger.getTransactionLogs = function(memberSymbol, transactionUUID, callback) {

  const filePath = getLogFilePath(memberSymbol, transactionUUID);

  fs.readFile(filePath, 'utf8', (err, data) => {
    var response = null;
    if (err) {
      logger.error('error reading filePath: ', filePath, 'error : ', err);
      response =  responseHelper.error('h_tl_1', "Invalid transactionUUID");
      }
    else {
      var dataCopy = data;
      dataCopy = dataCopy.replace(/\r/gm , "");
      var stringLogs = dataCopy.split(/\n/);
      var logs = [];
      var unprocessedLogs = [];
      stringLogs.forEach( function ( log ) {
        return logProcessor( log, logs, unprocessedLogs);
      });

      var returnObj = {
        'logs' : logs,
        "transactionUUID": transactionUUID,
        "memberSymbol": memberSymbol
      };
      if ( unprocessedLogs.length ) {
        returnObj[ "unprocessed" ] = unprocessedLogs;
      }
      response =  responseHelper.successWithData( returnObj );
    }
    callback && callback(response);
  });

};

TransactionLogger.getPendingTransactions = function (memberSymbol, callback ) {
  var filtered = [];
  Object.keys( _pending ).forEach( uuid => {
    //To-Do: Validate memberSymbol.
    if ( _pending[ uuid ] ) {
      //Is still pending?
      filtered.push( uuid );
    }
  });
  response = responseHelper.successWithData( { "pending_transaction_uuids" : filtered} );
  callback && callback( response );
};


TransactionLogger.getFailedTransactions = function (memberSymbol, callback ) {
  var filtered = [];
  Object.keys( _failed ).forEach( uuid => {
    //To-Do: Validate memberSymbol.
    if ( _pending[ uuid ] ) {
      //Is still pending?
      filtered.push( uuid );
    }
  });
  response = responseHelper.successWithData( {"failed_transaction_uuids": filtered} );
  callback && callback( response );
};

TransactionLogger.debug = {


  "findAllPending": function ( memberSymbol ) {
    const oThis = this;

    memberSymbol = memberSymbol || "";

    if ( !memberSymbol.length ) {
      console.log("Please specify memberSymbol");
      return;
    }

    const symPrefix = memberSymbol + "-";
    const allPromises = [];
    fs.readdir( logFolder, function (err, fileNames) {
        // "files" is an Array with files names
        if (err) {
          logger.error("Something went wrong");
          logger.error( err );
          return;
        }

        fileNames.forEach( fileName => {
          if ( !fileName.startsWith( memberSymbol ) ) {
            return;
          }

          var transactionUUID = fileName.replace( symPrefix, "" ).replace(".json" , "");

          const txPromise = new Promise( (resolve, reject) => {
            TransactionLogger.getTransactionLogs(memberSymbol, transactionUUID, function ( response ) {
              oThis.processTransactionLog(response, resolve, reject);
            });
          });

          allPromises.push( txPromise );          

        });

        Promise.all( allPromises )
          .then(values => {
            logger.win("============= All logs processed =============");
          })
        ;
    });


  },

  "processTransactionLog": function ( getLogsResponse, resolve ) {
    const oThis = this;

    if ( !getLogsResponse.isSuccess() ) {
      logger.error("Failed to read logs");
      logger.info( JSON.stringify( getLogsResponse ) );
      resolve("error");
      return;
    }

    const logs = getLogsResponse.data.logs;
    const completeLog = logs.find( log => {
      return log.logLevel === "COMPLETE";
    });

    if ( !completeLog ) {
      logger.info("Incomlete log found. transactionUUID = ", getLogsResponse.data.transactionUUID);
    }
    resolve("done");
  }
};

