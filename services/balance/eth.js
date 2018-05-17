"use strict";

/**
 * Get ETH Balance of an address
 *
 * @module services/balance/eth
 */

const rootPrefix = '../..'
  , etherInteractKlass = require(rootPrefix + '/lib/contract_interact/ether')
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
const EthBalanceKlass = function (params) {
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
        let errObj = responseHelper.error({
          internal_error_identifier: 's_b_e_1',
          api_error_identifier: 'invalid_address',
          error_config: basicHelper.fetchErrorConfig()
        });

        return Promise.resolve(errObj);
      }

      var etherInteractObj = new etherInteractKlass();

      return etherInteractObj.getBalanceOf(oThis.address);
    } catch (err) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_b_e_2',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

  }

};

module.exports = EthBalanceKlass;