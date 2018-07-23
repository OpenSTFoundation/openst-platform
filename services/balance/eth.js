"use strict";

/**
 * Get ETH Balance of an address
 *
 * @module services/balance/eth
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;


require(rootPrefix + '/lib/contract_interact/ether');

/**
 * Eth balance
 *
 * @param {object} params -
 * @param {string} params.address - Account address
 *
 * @constructor
 */
const EthBalanceKlass = function (params) {
  const oThis = this;

  params = params || {};
  oThis.address = params.address;
};

EthBalanceKlass.prototype = {

  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: function () {
    const oThis = this;

    return oThis.asyncPerform()
      .catch(function (error) {
        logger.error('openst-platform::services/balance/eth.js::perform::catch');
        logger.error(error);

        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          return responseHelper.error({
            internal_error_identifier: 's_b_e_2',
            api_error_identifier: 'something_went_wrong',
            error_config: basicHelper.fetchErrorConfig()
          });

        }
      });
  },

  /**
   * Async Perform
   *
   * @return {promise<result>}
   */
  asyncPerform: async function () {
    const oThis = this;

    //Validations
    if (!basicHelper.isAddressValid(oThis.address)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_b_e_1',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    let etherInteractKlass = oThis.ic().getEtherInteractClass();
    let etherInteractObj = new etherInteractKlass();

    return etherInteractObj.getBalanceOf(oThis.address);

  }

};

InstanceComposer.registerShadowableClass(EthBalanceKlass, 'getEthBalanceService');

module.exports = EthBalanceKlass;