"use strict";

/**
 * Check the status of different services of platform
 *
 * @module services/utils/platform_status
 */

const rootPrefix = '../..'
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * Constructor for platform service status
 *
 * @constructor
 */
const PlatformStatusKlass = function () {
};

PlatformStatusKlass.prototype = {
  /**
   * Check status of all services
   *
   * @return {promise<result>}
   */
  perform: async function () {

    const oThis = this
      , statusResponse = {chain: {value: false, utility: false}};

    // check geth status
    for (var chainName in statusResponse.chain) {
      var response = await oThis._gethStatus(chainName);
      if (response.isSuccess()) {
        statusResponse.chain[chainName] = true;
      } else {
        return Promise.resolve(response);
      }
    }

    return Promise.resolve(responseHelper.successWithData(statusResponse));

  },

  /**
   * Check geth status
   *
   * @param {string} chain - chain name
   *
   * @return {promise<result>}
   * @private
   * @ignore
   */
  _gethStatus: function (chain) {
    const web3Provider = web3ProviderFactory.getProvider(chain, web3ProviderFactory.typeWS)
      , retryAttempts = 100
      , timerInterval = 5000
      , chainTimer = {timer: undefined, blockNumber: 0, retryCounter: 0}
    ;
    if (!web3Provider) {
      // this is a error scenario.
      let errObj = responseHelper.error({
        internal_error_identifier: 's_u_ps_1',
        api_error_identifier: 'invalid_chain',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.reject(errObj);
    }

    return new Promise(function (onResolve, onReject) {
      chainTimer['timer'] = setInterval(function () {
        if (chainTimer['retryCounter'] <= retryAttempts) {
          web3Provider.eth.getBlockNumber(function (err, blocknumber) {
            if (err) {
              logger.error("Geth Checker - " + chain + " fetch block number failed.", err);
              chainTimer['retryCounter']++;
            } else {
              if (chainTimer['blockNumber'] != 0 && chainTimer['blockNumber'] != blocknumber) {
                clearInterval(chainTimer['timer']);
                onResolve(responseHelper.successWithData({}));
              }
              chainTimer['blockNumber'] = blocknumber;
            }
          });
        } else {
          logger.error("Geth Checker - " + chain + " chain has no new blocks.");

          let errObj = responseHelper.error({
            internal_error_identifier: 's_u_ps_2_' + chain,
            api_error_identifier: 'no_new_blocks',
            error_config: basicHelper.fetchErrorConfig()
          });
          onReject(errObj);
        }
        chainTimer['retryCounter']++;
      }, timerInterval);
    });

  }
};

module.exports = PlatformStatusKlass;