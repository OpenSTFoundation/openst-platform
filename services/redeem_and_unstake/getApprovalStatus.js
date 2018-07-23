"use strict";

/**
 * Get Approval Status
 */

const rootPrefix = '../..'
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

const getApprovalStatus = async function (approvalTransactionHash) {
  try {
    const approvalTxReceipt = await contractInteractHelper
      .waitAndGetTransactionReceipt(web3ProviderFactory.getProvider('utility','ws'), approvalTransactionHash);

    if (!approvalTxReceipt || !approvalTxReceipt.isSuccess()) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_rau_gas_1',
        api_error_identifier: 'transaction_not_mined',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    const approvalFormattedTxReceipt = approvalTxReceipt.data.formattedTransactionReceipt;
    const approvalFormattedEvents = await web3EventsFormatter.perform(approvalFormattedTxReceipt);

    // check whether Approval is present in the events.
    if (!approvalFormattedEvents || !approvalFormattedEvents['Approval']) {
      // this is a error scenario.
      let errObj = responseHelper.error({
        internal_error_identifier: 's_rau_gas_2',
        api_error_identifier: 'event_not_found_in_transaction_receipt',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    return Promise.resolve(responseHelper.successWithData({}));


  } catch (err) {
    return Promise.reject('Something went wrong. ' + err.message)
  }
};

module.exports = getApprovalStatus;