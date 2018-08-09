'use strict';

/**
 * Get approved allowance
 *
 * @module services/approve/get_allowance
 */

const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  InstanceComposer = require(rootPrefix + '/instance_composer');

require(rootPrefix + '/lib/contract_interact/branded_token');

/**
 * Get approved allowance
 *
 * @param {object} params
 * @param {string} params.erc20_address - ERC20 Address
 * @param {string} params.owner_address - Owner Address
 * @param {string} params.spender_address - Spender Address
 *
 * @constructor
 */
const GetAllowance = function(params) {
  const oThis = this;

  params = params || {};
  oThis.erc20Address = params.erc20_address;
  oThis.ownerAddress = params.owner_address;
  oThis.spenderAddress = params.spender_address;
};

GetAllowance.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: function() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error('openst-platform::services/approve/get_allowance.js::perform::catch');
        logger.error(error);

        return responseHelper.error({
          internal_error_identifier: 's_a_ga_1',
          api_error_identifier: 'unhandled_error',
          error_config: basicHelper.fetchErrorConfig()
        });
      }
    });
  },

  /**
   * Async Perform
   *
   * @return {promise<result>}
   */
  asyncPerform: async function() {
    const oThis = this;

    await oThis._validate();

    return oThis._getAllowance();
  },

  /**
   * Validate
   *
   * @return {promise<result>}
   * @private
   * @ignore
   */
  _validate: async function() {
    const oThis = this;

    //Validations

    if (!basicHelper.isAddressValid(oThis.ownerAddress)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_a_ga_3',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.reject(errObj);
    }

    if (!basicHelper.isAddressValid(oThis.spenderAddress)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_a_ga_4',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.reject(errObj);
    }

    return Promise.resolve(responseHelper.successWithData({}));
  },

  /**
   * Approve
   *
   * @return {promise<result>}
   * @private
   * @ignore
   */
  _getAllowance: async function() {
    const oThis = this,
      BrandedTokenKlass = oThis.ic().getBrandedTokenInteractClass(),
      brandedToken = new BrandedTokenKlass({ ERC20: oThis.erc20Address });

    const r = await brandedToken.getAllowance(oThis.ownerAddress, oThis.spenderAddress);

    return Promise.resolve(r);
  }
};

InstanceComposer.registerShadowableClass(GetAllowance, 'getAllowanceService');

module.exports = GetAllowance;
