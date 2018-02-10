"use strict";

/**
 * Get ETH Balance of an address
 *
 * @module services/balance/eth
 */

const rootPrefix = '../..'
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * Eth balance
 *
 * @param {object} params -
 * @param {string} params.address - Account address
 *
 * @constructor
 */
const EthBalanceKlass = function(params) {
  const oThis = this;

  params = params || {};
  oThis.address = params.address;
};

EthBalanceKlass.prototype = {

  perform: function () {
    const oThis = this;

    try {
      //Validations
      if (!basicHelper.isAddressValid(oThis.address)) {
        return Promise.resolve(responseHelper.error('s_b_e_1', 'Invalid address'));
      }

      return fundManager.getEthBalanceOf(oThis.address);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_b_e_2', 'Something went wrong. ' + err.message));
    }

  }

};

module.exports = EthBalanceKlass;