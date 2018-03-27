"use strict";

/**
 * Get Registration Status
 *
 * @module services/on_boarding/get_registration_status
 */

const rootPrefix = '../..'
  , web3UcRpcProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , getReceipt = require(rootPrefix + '/services/transaction/get_receipt')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , RegistrationStatusKlass = require(rootPrefix + '/helpers/registration_status')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

const openStUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , openStValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
  , openSTUtilityContractInteract = new OpenStUtilityKlass(openStUtilityContractAddr)
  , openSTValueContractInteract = new OpenSTValueKlass(openStValueContractAddr)
;

/**
 * Registration status service
 *
 * @param {object} params -
 * @param {string} params.transaction_hash - Transaction hash for lookup
 *
 * @constructor
 */
const GetRegistrationStatusKlass = function(params) {
  const oThis = this
  ;

  params = params || {};
  oThis.transactionHash = params.transaction_hash;
};

GetRegistrationStatusKlass.prototype = {

  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: async function() {
    const oThis = this
    ;

    try {
      // validations
      if (!basicHelper.isTxHashValid(oThis.transactionHash)) {
        return Promise.resolve(responseHelper.error('s_ob_grs_1', 'Invalid transaction hash'));
      }

      // returns the registration status of the proposal
      const registrationStatus = new RegistrationStatusKlass()
      ;

      // check if the proposal transaction is mined
      const getReceiptObj = new getReceipt({transaction_hash: oThis.transactionHash, chain: web3UcRpcProvider.chainKind});
      const proposalTxReceiptResponse = await getReceiptObj.perform();
      // if error or transaction not yet mined or transaction failed, return. Else proceed and check for other things
      if (!proposalTxReceiptResponse.isSuccess() || !proposalTxReceiptResponse.data.formattedTransactionReceipt) {
        return registrationStatus.returnResultPromise();
      }
      registrationStatus.setIsProposalDone(1);

      const proposalFormattedTxReceipt = proposalTxReceiptResponse.data.formattedTransactionReceipt;
      const proposalFormattedEvents = await web3EventsFormatter.perform(proposalFormattedTxReceipt);

      const uuid = proposalFormattedEvents['ProposedBrandedToken']['_uuid'];
      registrationStatus.setUuid(uuid);

      // now checking to confirm if registration on UC took place
      const registeredOnUCResponse = await openSTUtilityContractInteract.registeredToken(uuid);

      if(!registeredOnUCResponse ||
        !registeredOnUCResponse.isSuccess() ||
        (registeredOnUCResponse.data.erc20Address == '0x0000000000000000000000000000000000000000')) {
        return registrationStatus.returnResultPromise();
      }

      registrationStatus.setIsRegisteredOnUc(1);
      registrationStatus.setErc20Address(registeredOnUCResponse.data.erc20Address);

      // now checking to confirm if registration on VC took place
      const registeredOnVCResponse = await openSTValueContractInteract.utilityTokens(uuid);

      if(!registeredOnVCResponse ||
        !registeredOnVCResponse.isSuccess() ||
        (registeredOnVCResponse.data.symbol.length == 0)) {
        return registrationStatus.returnResultPromise();
      }
      registrationStatus.setIsRegisteredOnVc(1);

      return registrationStatus.returnResultPromise();
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_ob_grs_3', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = GetRegistrationStatusKlass;