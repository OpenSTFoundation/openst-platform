"use strict";

/**
 * Get Registration Status
 *
 * @module services/on_boarding/get_registration_status
 */

const rootPrefix = '../..'
  , web3UcRpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , RegistrationStatusKlass = require(rootPrefix + '/helpers/registration_status')
;

const openStUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , openStValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
  , openSTUtilityContractInteract = new OpenStUtilityKlass(openStUtilityContractAddr)
  , openSTValueContractInteract = new OpenSTValueKlass(openStValueContractAddr)
;

/**
 * Registration status service
 *
 * @param {object} params - this is object with keys - transaction_hash (BT proposal)
 *
 * @constructor
 */
const GetRegistrationStatusKlass = function(params) {
  const oThis = this
  ;

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
      // returns the registration status of the proposal
      const registrationStatus = new RegistrationStatusKlass()
      ;

      // check if the proposal transaction is mined
      const proposalTxReceiptResponse = await contractInteractHelper.getTxReceipt(web3UcRpcProvider, oThis.transactionHash);
      if(!proposalTxReceiptResponse || !proposalTxReceiptResponse.isSuccess()) {
        return registrationStatus.returnResultPromise();
      }

      const proposalFormattedTxReceipt = proposalTxReceiptResponse.data.formattedTransactionReceipt;
      const proposalFormattedEvents = await web3EventsFormatter.perform(proposalFormattedTxReceipt);

      // check whether ProposedBrandedToken is present in the events in the transaction receipt
      if(!proposalFormattedEvents || !proposalFormattedEvents['ProposedBrandedToken']) {
        // this is a error scenario.
        return Promise.resolve(responseHelper.error('s_ob_grs_1',
          'Proposal was not done correctly. Transaction does not have ProposedBrandedToken event'));
      }

      registrationStatus.setIsProposalDone(1);

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
      return Promise.resolve(responseHelper.error('s_ob_grs_2', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = GetRegistrationStatusKlass;