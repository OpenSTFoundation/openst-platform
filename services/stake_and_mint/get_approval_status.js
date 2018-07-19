"use strict";

/**
 * Get Approval Status
 *
 *
 * @module services/stake_and_mint/get_approval_status
 */

const rootPrefix = '../..'
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

require(rootPrefix + '/services/transaction/get_receipt');

/**
 * Get approval status
 *
 * @param {object} params -
 * @param {string} params.transaction_hash - Transaction hash for lookup
 *
 * @constructor
 */
const GetApprovalStatusKlass = function (params) {
  const oThis = this
  ;

  params = params || {};
  oThis.transactionHash = params.transaction_hash;
  oThis.chain = 'value';
};

GetApprovalStatusKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    const oThis = this
    ;

    try {
      let TransactionReceiptServiceKlass = oThis.ic().getTransactionReceiptService();
      const getReceiptObj = new TransactionReceiptServiceKlass({transaction_hash: oThis.transactionHash, chain: oThis.chain});
      const receiptResponse = await getReceiptObj.perform();
      return Promise.resolve(receiptResponse);
    } catch (err) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_sam_gas_1',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
  }
};

InstanceComposer.registerShadowableClass(GetApprovalStatusKlass, "getApprovalStatusService");

module.exports = GetApprovalStatusKlass;