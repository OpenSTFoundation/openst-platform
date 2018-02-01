"use strict";

/**
 * Get Registration Status
 */

const rootPrefix = '../..'
  , web3UcRpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  ;


const openStUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , openStValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
  , openSTUtilityContractInteract = new OpenStUtilityKlass(openStUtilityContractAddr)
  , openSTValueContractInteract = new OpenSTValueKlass(openStValueContractAddr)
;

const RegistrationStatus = function() {
  this.uuid = '';
  this.erc20Address = '';
  this.isProposalDone = 0;
  this.isRegisteredOnUc = 0;
  this.isRegisteredOnVc = 0;
};

RegistrationStatus.prototype = {

  constructor: RegistrationStatus,

  toHash: function() {
    var oThis = this;

    return {
      uuid: oThis.uuid,
      erc20_address: oThis.erc20Address,
      is_proposal_done: oThis.isProposalDone,
      is_registered_on_uc: oThis.isRegisteredOnUc,
      is_registered_on_vc: oThis.isRegisteredOnVc
    }
  },

  returnStatusPromise: function() {
    var oThis = this;

    return Promise.resolve(oThis.toHash())
  },

  setUuid: function(uuid) {
    var oThis = this;
    oThis.uuid = uuid;
  },

  setErc20Address: function(erc20Address) {
    var oThis = this;
    oThis.erc20Address = erc20Address;
  },

  setIsRegisteredOnUc: function(isRegisteredOnUc) {
    var oThis = this;
    oThis.isRegisteredOnUc = isRegisteredOnUc;
  },

  setIsRegisteredOnVc: function(isRegisteredOnVc) {
    var oThis = this;
    oThis.isRegisteredOnVc = isRegisteredOnVc;
  },

  setIsProposalDone: function(isProposalDone) {
    var oThis = this;
    oThis.isProposalDone = isProposalDone;
  }


};

const getRegistrationStatus = async function (proposalTransactionHash) {
  try {
    // returns the registration status of the proposal
    const registrationStatus = new RegistrationStatus();

    const proposalTxReceipt = await contractInteractHelper.getTxReceipt(web3UcRpcProvider, proposalTransactionHash);

    if(!proposalTxReceipt || !proposalTxReceipt.isSuccess()) {
      return registrationStatus.returnStatusPromise();
    }

    const proposalFormattedTxReceipt = proposalTxReceipt.data.formattedTransactionReceipt;
    const proposalFormattedEvents = await web3EventsFormatter.perform(proposalFormattedTxReceipt);

    // check whether ProposedBrandedToken is present in the events.

    if(!proposalFormattedEvents || !proposalFormattedEvents['ProposedBrandedToken']) {
      // this is a error scenario.
      return Promise.reject('Proposal was not done correctly. Transaction does not have ProposedBrandedToken event');
    }

    registrationStatus.setIsProposalDone(1);

    const uuid = proposalFormattedEvents['ProposedBrandedToken']['_uuid'];

    registrationStatus.setUuid(uuid);

    // now checking to confirm if registration on UC took place

    var registeredOnUCResult = await openSTUtilityContractInteract.registeredTokenProperty(uuid);

    if(!registeredOnUCResult ||
      !registeredOnUCResult.isSuccess() ||
      (registeredOnUCResult.data.erc20Address == '0x0000000000000000000000000000000000000000')) {
      return registrationStatus.returnStatusPromise();
    }

    registrationStatus.setIsRegisteredOnUc(1);
    registrationStatus.setErc20Address(registeredOnUCResult.data.erc20Address);

    // now checking to confirm if registration on VC took place


    var registeredOnVCResult = await openSTValueContractInteract.utilityTokenProperties(uuid);

    if(!registeredOnVCResult ||
      !registeredOnVCResult.isSuccess() ||
      (registeredOnVCResult.data.symbol.length == 0)) {
      return registrationStatus.returnStatusPromise();
    }

    registrationStatus.setIsRegisteredOnVc(1);

    return registrationStatus.returnStatusPromise();


  } catch (err) {
    return Promise.reject('Something went wrong. ' + err.message)
  }
};

module.exports = getRegistrationStatus;