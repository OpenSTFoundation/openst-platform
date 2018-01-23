"use strict";

/**
 * Get Registration Status
 */

const rootPrefix = '../..'
  , web3UcRpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , web3VcRpcProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , openSTUtilityContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , openSTValueContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
;


const openStUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , openStValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass(openStUtilityContractAddr)
  , openSTValueContractInteract = new openSTValueContractInteractKlass(openStValueContractAddr)
;

const StakeAndMintStatus = function() {
  this.uuid = '';
  this.erc20Address = '';
  this.isStakeDone = 0;
  this.isRegisteredOnUc = 0;
  this.isRegisteredOnVc = 0;
};

StakeAndMintStatus.prototype = {

  constructor: StakeAndMintStatus,

  toHash: function() {
    var oThis = this;

    return {
      is_stake_done: oThis.isStakeDone,
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

  setIsStakeDone: function(isStakeDone) {
    var oThis = this;
    oThis.isStakeDone = isStakeDone;
  }


};

const getRegistrationStatus = async function (proposalTransactionHash) {
  try {
    // returns the registration status of the proposal
    const registrationStatus = new StakeAndMintStatus();

    const proposalTxReceipt = await helper.getTxReceipt(web3UcRpcProvider, proposalTransactionHash);

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

    registrationStatus.setIsStakeDone(1);

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