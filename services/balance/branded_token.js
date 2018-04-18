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
 * @param {boolean} [params.use_cache] - Should caching be used for balance. 1 -> use cache. 0 -> don't use cache. Default: 1
 *
 * @constructor
 */
const BrandedTokenBalanceKlass = function (params) {
  const oThis = this;

  params = params || {};
  oThis.erc20Address = params.erc20_address;
  oThis.address = params.address;
  oThis.use_cache = params.use_cache == 0 ? 0 : 1;
};

BrandedTokenBalanceKlass.prototype = {

  perform: function () {
    const oThis = this;

    try {
      //Validations
      if (!basicHelper.isAddressValid(oThis.erc20Address)) {
        return Promise.resolve(responseHelper.error('s_b_bt_1', 'Invalid ERC20 address'));
      }
      if (!basicHelper.isAddressValid(oThis.address)) {
        return Promise.resolve(responseHelper.error('s_b_bt_2', 'Invalid address'));
      }

      var brandedToken = new BrandedTokenKlass({ERC20: oThis.erc20Address});

      if (oThis.use_cache == 0) {
        return brandedToken.getBalanceWithoutCache(oThis.address);
      } else {
        return brandedToken.getBalanceOf(oThis.address);
      }
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_b_bt_3', 'Something went wrong. ' + err.message));
    }

  }

};

module.exports = BrandedTokenBalanceKlass;