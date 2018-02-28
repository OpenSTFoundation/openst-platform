"use strict";

/**
 * Approve for spending Branded Token
 *
 * @module services/approve/branded_token
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

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

  perform: function () {
    const oThis = this;

    try {
      //Validations
      if (!basicHelper.isAddressValid(oThis.erc20Address)) {
        return Promise.resolve(responseHelper.error('s_a_bt_1', 'Invalid ERC20 address'));
      }

      if (!basicHelper.isAddressValid(oThis.approverAddress)) {
        return Promise.resolve(responseHelper.error('s_a_bt_2', 'Invalid approver address'));
      }

      if(oThis.toApproveAmount.lessThan(0)) {
        return Promise.resolve(responseHelper.error('s_a_bt_3', 'Invalid to approve amount'));
      }

      return oThis._approve();

    } catch (err) {
      return Promise.resolve(responseHelper.error('s_a_bt_4', 'Something went wrong. ' + err.message));
    }
  },

  /**
   * Approve
   *
   * @return {promise<result>}
   * @private
   * @ignore
   */
  _approve: async function () {
    const oThis = this
      , brandedToken = new BrandedTokenKlass({ERC20: oThis.erc20Address})
      , isTxHashOnlyNeeded = (oThis.returnType === 'txHash')
    ;

    const r = await brandedToken.approve(
      oThis.approverAddress,
      oThis.approverPassphrase,
      oThis.approveeAddress,
      oThis.toApproveAmount,
      isTxHashOnlyNeeded // we need this to be done in async and not to wait for the tx to get mined.
    );

    if (isTxHashOnlyNeeded) {
      return Promise.resolve(responseHelper.successWithData({transaction_hash: r}));
    } else {
      return Promise.resolve(r);
    }

  }

};

module.exports = ApproveForBrandedTokenKlass;