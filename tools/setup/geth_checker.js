"use strict";
/**
 * Check if utility and value chain geth nodes are up and running
 *
 * @module tools/setup/geth_checker
 */
const rootPrefix = "../.."
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
;

require(rootPrefix + '/lib/web3/providers/factory');

/**
 * Constructor for geth checker
 *
 * @constructor
 */
const GethCheckerKlass = function (configStrategy, instanceComposer) {

};

GethCheckerKlass.prototype = {
  /**
   * Check if chains started mining and are ready
   *
   * @return {promise}
   */
  perform: function () {
    const oThis = this
      , promiseArray = []
    ;

    for (var chain in setupConfig.chains) {
      promiseArray.push(oThis._isRunning(chain));
    }
    return Promise.all(promiseArray);
  },

  /**
   * Check if mentioned chain started mining and are ready
   *
   * @param {string} chain - name of the chain
   *
   * @return {promise}
   */
  _isRunning: function(chain) {

    const oThis = this
      , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
      , retryAttempts       = 100
      , timerInterval       = 5000
      , chainTimer          = {timer: undefined, blockNumber: 0, retryCounter: 0}
    ;

    chain = String( chain ).toLowerCase();
    if ( chain !== 'utility' ) {
      chain = 'value';
    }

    const provider = web3ProviderFactory.getProvider(chain, 'ws');

    return new Promise(function (onResolve, onReject) {
      chainTimer['timer'] = setInterval(function () {
        if (chainTimer['retryCounter'] <= retryAttempts) {
          provider.eth.getBlockNumber(function (err, blocknumber) {
            if (err) {
              console.log("getBlockNumber err: ", err);
            } else {
              if (chainTimer['blockNumber']!=0 && chainTimer['blockNumber']!=blocknumber) {
                logger.info("* Geth Checker - " + chain + " chain has new blocks.");
                clearInterval(chainTimer['timer']);
                onResolve();
              }
              chainTimer['blockNumber'] = blocknumber;
            }
          });
        } else {
          logger.error("Geth Checker - " + chain + " chain has no new blocks.");
          onReject();
          process.exit(1);
        }
        chainTimer['retryCounter']++;
      }, timerInterval);
    });
  }
};

InstanceComposer.register(GethCheckerKlass, "getSetupGethChecker", true);

module.exports = GethCheckerKlass;
