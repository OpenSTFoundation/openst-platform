"use strict";

/**
 * Get Branded Token Balance of an address
 *
 * @module services/balance/branded_token
 */

const rootPrefix = '../..'
  , fundManager = require(rootPrefix + '/lib/fund_manager')
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
const BrandedTokenBalanceKlass = function(params) {
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
        return Promise.resolve(responseHelper.error('s_b_bt_1', 'Invalid ERC20 address'));
      }
      if (!basicHelper.isAddressValid(oThis.address)) {
        return Promise.resolve(responseHelper.error('s_b_bt_2', 'Invalid address'));
      }

      return fundManager.getBrandedTokenBalanceOf(this.erc20Address, oThis.address);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_b_bt_3', 'Something went wrong. ' + err.message));
    }

  }

};

module.exports = BrandedTokenBalanceKlass;