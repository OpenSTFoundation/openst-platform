'use strict';

/**
 * Approve for spending Branded Token
 *
 * @module services/approve/branded_token
 */

const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  InstanceComposer = require(rootPrefix + '/instance_composer');

require(rootPrefix + '/lib/contract_interact/branded_token');

/**
 * Approve for spending Branded Token
 *
 * @param {object} params
 * @param {string} params.erc20_address - Branded token EIP20 address
 * @param {string} params.approver_address - Approver address
 * @param {string} params.approver_passphrase - Approver passphrase
 * @param {string} params.approvee_address - Approvee address
 * @param {number} params.to_approve_amount - To Approve amount in weis
 * @param {object} params.options - optional params
 *
 * @constructor
 */
const ApproveForBrandedTokenKlass = function(params) {
  const oThis = this;

  params = params || {};
  oThis.erc20Address = params.erc20_address;
  oThis.approverAddress = params.approver_address;
  oThis.approverPassphrase = params.approver_passphrase;
  oThis.approveeAddress = params.approvee_address;
  oThis.toApproveAmount = new BigNumber(params.to_approve_amount);
  oThis.returnType = (params.options || {}).returnType || 'txHash';
};

ApproveForBrandedTokenKlass.prototype = {
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
        logger.error('openst-platform::services/approve/branded_token.js::perform::catch');
        logger.error(error);

        return responseHelper.error({
          internal_error_identifier: 's_a_bt_1',
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

    return oThis._approve();
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
    if (!basicHelper.isAddressValid(oThis.erc20Address)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_a_bt_2',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.reject(errObj);
    }

    if (!basicHelper.isAddressValid(oThis.approverAddress)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_a_bt_3',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.reject(errObj);
    }

    if (oThis.toApproveAmount.lessThan(0)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_a_bt_4',
        api_error_identifier: 'invalid_amount',
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
  _approve: async function() {
    const oThis = this,
      BrandedTokenKlass = oThis.ic().getBrandedTokenInteractClass(),
      brandedToken = new BrandedTokenKlass({ ERC20: oThis.erc20Address }),
      isTxHashOnlyNeeded = oThis.returnType === 'txHash';

    const r = await brandedToken.approve(
      oThis.approverAddress,
      oThis.approverPassphrase,
      oThis.approveeAddress,
      oThis.toApproveAmount,
      isTxHashOnlyNeeded // we need this to be done in async and not to wait for the tx to get mined.
    );

    return Promise.resolve(r);
  }
};

InstanceComposer.registerShadowableClass(ApproveForBrandedTokenKlass, 'getApproveBrandedTokenService');

module.exports = ApproveForBrandedTokenKlass;
