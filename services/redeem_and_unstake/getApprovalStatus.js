"use strict";

/**
 * Get Approval Status
 */

const rootPrefix = '../..'
  , web3UcProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
;

const getApprovalStatus = async function (approvalTransactionHash) {
  try {
    const approvalTxReceipt = await contractInteractHelper.waitAndGetTransactionReceipt(web3UcProvider, approvalTransactionHash);

    if (!approvalTxReceipt || !approvalTxReceipt.isSuccess()) {
      return Promise.resolve(responseHelper.error('s_rau_gas_1', 'approval not yet mined.'));
    }

    const approvalFormattedTxReceipt = approvalTxReceipt.data.formattedTransactionReceipt;
    const approvalFormattedEvents = await web3EventsFormatter.perform(approvalFormattedTxReceipt);

    // check whether Approval is present in the events.
    if (!approvalFormattedEvents || !approvalFormattedEvents['Approval']) {
      // this is a error scenario.
      return Promise.resolve(responseHelper.error('s_rau_gas_2', 'Approval event was not found in the reseipt.'));
    }

    return Promise.resolve(responseHelper.successWithData({}));


  } catch (err) {
    return Promise.reject('Something went wrong. ' + err.message)
  }
};

module.exports = getApprovalStatus;