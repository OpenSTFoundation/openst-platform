"use strict";

/**
 * Get simple token Balance of an address
 *
 * @module services/balance/simple_token
 */

const rootPrefix = '../..'
  , simpleToken = require(rootPrefix + '/lib/contract_interact/simple_token')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

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

  perform: function () {
    const oThis = this;

    try {
      //Validations
      if (!basicHelper.isAddressValid(oThis.address)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_b_st_1',
          api_error_identifier: 'invalid_address',
          error_config: basicHelper.fetchErrorConfig()
        });

        return Promise.resolve(errObj);
      }

      return simpleToken.balanceOf(oThis.address);
    } catch (err) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_b_st_2',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

  }

};

module.exports = SimpleTokenBalanceKlass;