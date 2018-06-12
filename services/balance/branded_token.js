"use strict";

/**
 * Get Branded Token Balance of an address
 *
 * @module services/balance/branded_token
 */

const rootPrefix = '../..'
  , BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * Branded Token balance
 *
 * @param {object} params -
 * @param {string} params.erc20_address - Branded token EIP20 address
 * @param {string} params.address - Account address
 *
 * @constructor
 */
const BrandedTokenBalanceKlass = function (params) {
  const oThis = this;

  params = params || {};
  oThis.erc20Address = params.erc20_address;
  oThis.address = params.address;
};

BrandedTokenBalanceKlass.prototype = {

  perform: function () {
    const oThis = this;

    try {
      //Validations
      if (!basicHelper.isAddressValid(oThis.erc20Address)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_b_bt_1',
          api_error_identifier: 'invalid_address',
          error_config: basicHelper.fetchErrorConfig()
        });

        return Promise.resolve(errObj);
      }
      if (!basicHelper.isAddressValid(oThis.address)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_b_bt_2',
          api_error_identifier: 'invalid_address',
          error_config: basicHelper.fetchErrorConfig()
        });

        return Promise.resolve(errObj);
      }

      var brandedToken = new BrandedTokenKlass({ERC20: oThis.erc20Address});


      return brandedToken.getBalanceOf(oThis.address);

    } catch (err) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_b_bt_3',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

  }

};

module.exports = BrandedTokenBalanceKlass;