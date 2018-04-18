"use strict";

/**
 * Get Approval Status
 *
 *
 * @module services/stake_and_mint/get_approval_status
 */

const rootPrefix = '../..'
  , getReceipt = require(rootPrefix + '/services/transaction/get_receipt')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

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
      const getReceiptObj = new getReceipt({transaction_hash: oThis.transactionHash, chain: oThis.chain});
      const receiptResponse = await getReceiptObj.perform();
      return Promise.resolve(receiptResponse);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_sam_gas_1', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = GetApprovalStatusKlass;