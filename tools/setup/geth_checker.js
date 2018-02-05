"use strict";
/**
 * Check if utility and value chain geth nodes are up and running
 *
 * @module tools/setup/geth_checker
 */
const rootPrefix = "../.."
  , web3RpcUtilityProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , web3RpcValueProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , setupConfig = require(rootPrefix + '/tools/setup/config')
;

/**
 * Constructor for geth checker
 *
 * @constructor
 */
const GethCheckerKlass = function () {};

GethCheckerKlass.prototype = {
  /**
   * Check if chains started mining and are ready
   *
   * @return {promise}
   */
  perform: function () {
    const oThis = this;

    return new Promise(async function (onResolve, onReject) {
      for (var chain in setupConfig.chains) {
        await oThis._isRunning(chain);
      }

      onResolve();
    });
  },

  /**
   * Check if mentioned chain started mining and are ready
   *
   * @param {string} chain - name of the chain
   *
   * @return {promise}
   */
  _isRunning: function(chain) {
    const retryAttempts = 10
      , timerInterval = 5000
      , chainTimer = {timer: undefined, blockNumber: 0, retryCounter: 0}
      , provider = (chain == 'utility' ? web3RpcUtilityProvider : web3RpcValueProvider);
    ;
    return new Promise(function (onResolve, onReject) {
      chainTimer['timer'] = setInterval(function () {
        if (chainTimer['retryCounter'] <= retryAttempts) {
          provider.eth.getBlockNumber(function (err, blocknumber) {
            if (err) {
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

module.exports = new GethCheckerKlass();
