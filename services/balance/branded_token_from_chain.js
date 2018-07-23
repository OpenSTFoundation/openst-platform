"use strict";

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , InstanceComposer = require(rootPrefix + "/instance_composer")
;

require(rootPrefix + '/lib/contract_interact/branded_token');

/**
 * Branded Token balance from Chain
 *
 * @param {object} params -
 * @param {string} params.erc20_address - Branded token EIP20 address
 * @param {string} params.address - Account address
 *
 * @constructor
 */

const GetBtBalanceFromChain = function (params) {
  const oThis = this;
  
  params = params || {};
  oThis.erc20Address = params.erc20_address;
  oThis.address = params.address;
};

GetBtBalanceFromChain.prototype = {
  /**
   *
   * Perform
   *
   * @return {Promise}
   *
   */
  perform: function () {
    const oThis = this
    ;
    
    return oThis.asyncPerform()
      .catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error(`${__filename}::perform::catch`);
          logger.error(error);
          return responseHelper.error({
            internal_error_identifier: 's_b_btfc_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: {}
          });
        }
      });
  },
  
  /**
   * asyncPerform
   *
   * @return {Promise}
   */
  asyncPerform: async function () {
    const oThis = this
    ;
    
    await oThis.validateAndSanitize();
    
    return oThis.getBalance();
  },
  
  /**
   * validateAndSanitize
   *
   */
  validateAndSanitize: async function () {
    const oThis = this
    ;
    
    if (!basicHelper.isAddressValid(oThis.erc20Address)) {
      return Promise.reject(responseHelper.error({
        internal_error_identifier: 's_b_btfc_2',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig(),
        debug_options: {}
      }));
    }
    
    if (!basicHelper.isAddressValid(oThis.address)) {
      return Promise.reject(responseHelper.error({
        internal_error_identifier: 's_b_btfc_3',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig(),
        debug_options: {}
      }));
    }
    
  },
  
  getBalance: async function () {
    const oThis = this
    ;
    
    let BrandedTokenKlass = oThis.ic().getBrandedTokenInteractClass();
    return new BrandedTokenKlass({ERC20: oThis.erc20Address}).getBtBalanceFromChain(oThis.address);
  }
  
};

InstanceComposer.registerShadowableClass(GetBtBalanceFromChain, "getBtBalanceFromChainService");

module.exports = GetBtBalanceFromChain;