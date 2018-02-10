"use strict";

/**
 * Get Approval Status
 *
 *
 * @module services/stake_and_mint/get_approval_status
 */

const rootPrefix = '../..'
  , web3VcRpcProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * Get approval status
 *
 * @param {object} params -
 * @param {string} params.transaction_hash - Transaction hash for lookup
 *
 * @constructor
 */
const GetApprovalStatusKlass = function(params) {
  const oThis = this
  ;

  params = params || {};
  oThis.approvalTransactionHash = params.transaction_hash;
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
      // validations
      if (!basicHelper.isTxHashValid(oThis.approvalTransactionHash)) {
        return Promise.resolve(responseHelper.error('s_sam_gas_1', 'Invalid transaction hash'));
      }

      const approvalTxReceipt = await contractInteractHelper.getTxReceipt(web3VcRpcProvider, oThis.approvalTransactionHash);

      if (!approvalTxReceipt || !approvalTxReceipt.isSuccess()) {
        return Promise.resolve(responseHelper.error('s_sam_gas_2', 'Approval not yet mined.'));
      }

      const approvalFormattedTxReceipt = approvalTxReceipt.data.formattedTransactionReceipt;
      const approvalFormattedEvents = await web3EventsFormatter.perform(approvalFormattedTxReceipt);

      // check whether Approval is present in the events.
      if (!approvalFormattedEvents || !approvalFormattedEvents['Approval']) {
        // this is a error scenario.
        return Promise.resolve(responseHelper.error('s_sam_gas_3', 'Approval event was not found in the reseipt.'));
      }

      return Promise.resolve(responseHelper.successWithData({}));
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_sam_gas_4', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = GetApprovalStatusKlass;