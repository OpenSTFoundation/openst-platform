'use strict';

/**
 * Get Approval Status
 *
 *
 * @module services/stake_and_mint/get_approval_status
 */

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

require(rootPrefix + '/services/transaction/get_receipt');

/**
 * Get approval status
 *
 * @param {object} params -
 * @param {string} params.transaction_hash - Transaction hash for lookup
 *
 * @constructor
 */
const GetApprovalStatusKlass = function(params) {
  const oThis = this;

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
  perform: function() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error('openst-platform::services/stake_and_mint/get_approval_status.js::perform::catch');
        logger.error(error);

        return responseHelper.error({
          internal_error_identifier: 's_sam_gas_1',
          api_error_identifier: 'something_went_wrong',
          error_config: basicHelper.fetchErrorConfig(),
          debug_options: { err: error }
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

    let TransactionReceiptServiceKlass = oThis.ic().getTransactionReceiptService();
    const getReceiptObj = new TransactionReceiptServiceKlass({
      transaction_hash: oThis.transactionHash,
      chain: oThis.chain
    });
    const receiptResponse = await getReceiptObj.perform();
    return Promise.resolve(receiptResponse);
  }
};

InstanceComposer.registerShadowableClass(GetApprovalStatusKlass, 'getApprovalStatusService');

module.exports = GetApprovalStatusKlass;
