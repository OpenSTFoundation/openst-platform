"use strict";

/**
 * Get Branded Token Balance of an address
 *
 * @module services/balance/branded_token
 */

const rootPrefix = '../..'
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Branded Token balance
 *
 * @param {object} params - this is object with keys - address, erc20_address
 *
 * @constructor
 */
const BrandedTokenBalanceKlass = function(params) {
  this.erc20Address = params.erc20_address;
  this.address = params.address;
};

BrandedTokenBalanceKlass.prototype = {

  perform: function () {
    const oThis = this;

    try {
      return fundManager.getBrandedTokenBalanceOf(this.erc20Address, oThis.address);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_b_bt_1', 'Something went wrong. ' + err.message));
    }

  }

};

module.exports = BrandedTokenBalanceKlass;