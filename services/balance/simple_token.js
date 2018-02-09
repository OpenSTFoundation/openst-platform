"use strict";

/**
 * Get simple token Balance of an address
 *
 * @module services/balance/simple_token
 */

const rootPrefix = '../..'
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * simple token prime balance
 *
 * @param {object} params - this is object with keys - address
 *
 * @constructor
 */
const SimpleTokenBalanceKlass = function(params) {
  this.address = params.address;
};

SimpleTokenBalanceKlass.prototype = {

  perform: function () {
    const oThis = this;

    try {
      return fundManager.getSTBalanceOf(oThis.address);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_b_st_1', 'Something went wrong. ' + err.message));
    }

  }

};

module.exports = SimpleTokenBalanceKlass;