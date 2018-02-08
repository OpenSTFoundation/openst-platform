"use strict";

/**
 * Get ETH Balance of an address
 *
 * @module services/balance/eth
 */

const rootPrefix = '../..'
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Eth balance
 *
 * @param {object} params - this is object with keys - address
 *
 * @constructor
 */
const EthBalanceKlass = function(params) {
  this.address = params.address;
};

EthBalanceKlass.prototype = {

  perform: function () {
    const oThis = this;

    try {
      return fundManager.getEthBalanceOf(oThis.address);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_b_e_1', 'Something went wrong. ' + err.message));
    }

  }

};

module.exports = EthBalanceKlass;