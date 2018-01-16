'use strict';

const rootPrefix = '..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  ;

const validateArgs = function () {
  const chain = process.argv[2];
  var web3RpcProvider = null;
  if (chain == 'value') {
    web3RpcProvider = require(rootPrefix + '/lib/web3/providers/value_rpc');
  } else if (chain == 'utility') {
    web3RpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc');
  } else {
    logger.error("Invalid arguments.\n It should be 'value' or 'utility");
    process.exit(1);
  }
  return web3RpcProvider;
}

const performer = async
function () {
  if (process.argv.length != 3) {
    logger.error("Invalid arguments !!!");
    process.exit(0);
  }

  const web3RpcProvider = validateArgs()
    , delay = 10 * 1000
    , timeoutValue = 5 * 60 * 1000
    ;

  var counter = 0
    , totalTime = counter * delay
    , isInProcess = false
    ;

  setInterval(function () {
    if (totalTime <= timeoutValue) {
      if (isInProcess == false) {
        isInProcess = true;
        web3RpcProvider.eth.getBlockNumber(function (err, blocknumber) {
          if (err) {
            logger.info("Unable to get blocknumber");
          } else {
            logger.info("blocknumber", blocknumber);
            process.exit(0);
          }
          isInProcess = false;
        });
      }
    } else {
      logger.error("GethChecker unable to complete process in time: ", timeoutValue);
      process.exit(1);
    }
    counter++;
    totalTime = counter * delay;
  }, delay);
}

performer();
