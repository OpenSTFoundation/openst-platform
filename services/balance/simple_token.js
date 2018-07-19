"use strict";

/**
 * Get simple token Balance of an address
 *
 * @module services/balance/simple_token
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , InstanceComposer = require( rootPrefix + "/instance_composer")
;


require(rootPrefix + '/lib/contract_interact/simple_token');

/**
 * simple token prime balance
 *
 * @param {object} params -
 * @param {string} params.address - Account address
 *
 * @constructor
 */
const SimpleTokenBalanceKlass = function (params) {
  const oThis = this;

  params = params || {};
  oThis.address = params.address;
};

SimpleTokenBalanceKlass.prototype = {

  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: function () {
    const oThis = this;

    return oThis.asyncPerform()
      .catch(function (error) {
        logger.error('openst-platform::services/balance/simple_token.js::perform::catch');
        logger.error(error);

        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          return responseHelper.error({
            internal_error_identifier: 's_b_st_2',
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
        internal_error_identifier: 's_b_st_1',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    let SimpleTokenKlass = oThis.ic().getSimpleTokenInteractClass();
    let simpleToken   = new SimpleTokenKlass();

    return simpleToken.balanceOf(oThis.address);

  }

};

InstanceComposer.registerShadowableClass(SimpleTokenBalanceKlass, 'getSimpleTokenBalanceService');

module.exports = SimpleTokenBalanceKlass;