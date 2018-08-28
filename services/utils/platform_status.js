'use strict';

/**
 * Check the status of different services of platform
 *
 * @module services/utils/platform_status
 */

const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  InstanceComposer = require(rootPrefix + '/instance_composer');

require(rootPrefix + '/lib/web3/providers/factory');

/**
 * Constructor for platform service status
 *
 * @constructor
 */
const PlatformStatusKlass = function() {};

PlatformStatusKlass.prototype = {
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
        logger.error('openst-platform::services/utils/platform_status.js::perform::catch');
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 's_u_ps_3',
          api_error_identifier: 'something_went_wrong',
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
    const oThis = this,
      statusResponse = { chain: { value: false, utility: false } };

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
  _gethStatus: function(chain) {
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(chain, web3ProviderFactory.typeWS),
      retryAttempts = 100,
      timerInterval = 5000,
      chainTimer = { timer: undefined, blockNumber: 0, retryCounter: 0 };

    return new Promise(function(onResolve, onReject) {
      chainTimer['timer'] = setInterval(async function() {
        if (!web3Provider) {
          // this is a error scenario.
          let errObj = responseHelper.error({
            internal_error_identifier: 's_u_ps_1',
            api_error_identifier: 'invalid_chain',
            error_config: basicHelper.fetchErrorConfig()
          });
          return Promise.reject(errObj);
        }

        if (chainTimer['retryCounter'] <= retryAttempts) {
          let blockNumber = await web3Provider.eth.getBlockNumber();

          if (!(blockNumber > 0)) {
            logger.error('Geth Checker - ' + chain + ' fetch block number failed.', err);
            chainTimer['retryCounter']++;
          } else {
            if (chainTimer['blockNumber'] != 0 && chainTimer['blockNumber'] != blockNumber) {
              clearInterval(chainTimer['timer']);
              onResolve(responseHelper.successWithData({}));
            }
            chainTimer['blockNumber'] = blockNumber;
          }

          // function (err, blocknumber) {
          //   if (err) {
          //     logger.error("Geth Checker - " + chain + " fetch block number failed.", err);
          //     chainTimer['retryCounter']++;
          //   } else {
          //     if (chainTimer['blockNumber'] != 0 && chainTimer['blockNumber'] != blocknumber) {
          //       clearInterval(chainTimer['timer']);
          //       onResolve(responseHelper.successWithData({}));
          //     }
          //     chainTimer['blockNumber'] = blocknumber;
          //   }
          // }
        } else {
          logger.error('Geth Checker - ' + chain + ' chain has no new blocks.');

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

InstanceComposer.registerShadowableClass(PlatformStatusKlass, 'getPlatformStatusService');

module.exports = PlatformStatusKlass;
