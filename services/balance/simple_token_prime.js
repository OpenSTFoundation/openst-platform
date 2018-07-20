"use strict";

/**
 * Get simple token prime Balance of an address
 *
 * @module services/balance/simple_token_prime
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;


require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/contract_interact/st_prime');

/**
 * simple token prime balance
 *
 * @param {object} params -
 * @param {string} params.address - Account address
 *
 * @constructor
 */
const SimpleTokenPrimeBalanceKlass = function (params) {
  const oThis = this;

  params = params || {};
  oThis.address = params.address;
};

SimpleTokenPrimeBalanceKlass.prototype = {

  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: function () {
    const oThis = this;

    return oThis.asyncPerform()
      .catch(function (error) {
        logger.error('openst-platform::services/balance/simple_token_prime.js::perform::catch');
        logger.error(error);

        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          return responseHelper.error({
            internal_error_identifier: 's_b_stp_2',
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

    let coreAddresses = oThis.ic().getCoreAddresses()
      , StPrimeKlass = oThis.ic().getStPrimeInteractClass()
      , stPrimeContractAddress = coreAddresses.getAddressForContract('stPrime')
      , stPrime = new StPrimeKlass(stPrimeContractAddress)
    ;

      //Validations
      if (!basicHelper.isAddressValid(oThis.address)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_b_stp_1',
          api_error_identifier: 'invalid_address',
          error_config: basicHelper.fetchErrorConfig()
        });

        return Promise.resolve(errObj);
      }

      return stPrime.getBalanceOf(oThis.address);

  }
};

InstanceComposer.registerShadowableClass(SimpleTokenPrimeBalanceKlass, 'getSimpleTokenPrimeBalanceService');

module.exports = SimpleTokenPrimeBalanceKlass;