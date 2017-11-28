"use strict";

const rootPrefix = '../..'
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix+'/lib/web3/events/queue_manager')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , openSTValueContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_value')
  , openSTValueContractInteract = new openSTValueContractInteractKlass()
  , openSTUtilityContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_utility')
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass()
  , eventQueueManager = new eventQueueManagerKlass()
  ;

const stakeAndMintInterComm = function() {
  eventQueueManager.setProcessor(this.processor);
  this.bindEvents();
};

stakeAndMintInterComm.prototype = {

  bindEvents: function () {
    logger.log("bindEvents binding StakingIntentDeclared");

    openSTValueContractInteract.listenToStakingIntentDeclared(
      interComm.onEventSubscriptionError,
      interComm.onEvent,
      interComm.onEvent
    );

    logger.log("bindEvents done");

  },

  onEvent: function ( eventObj ) {
    eventQueueManager.addEditEventInQueue(eventObj);
  },

  //Generic Method to log event subscription error
  onEventSubscriptionError: function ( error ) {
    logger.log("onEventSubscriptionError triggered");
    logger.error(error);
  },

  processor: function (eventObj) {
    const oThis = this
      , returnValues = eventObj.returnValues
      , uuid = returnValues._uuid
      , staker = returnValues._staker
      , stakerNonce = returnValues._stakerNonce
      , amountST = returnValues._amountST
      , amountUT = returnValues._amountUT
      , unlockHeight = returnValues._unlockHeight
      , stakingIntentHash = returnValues._stakingIntentHash
      , beneficiary = returnValues._beneficiary
      , chainIdUtility = returnValues._chainIdUtility; // TODO - use this later for getting the corresponding registrar address


    openSTUtilityContractInteract.confirmStakingIntent(
      coreAddresses.getAddressForUser('utilityRegistrar'),
      coreAddresses.getPassphraseForUser('utilityRegistrar'),
      staker,
      stakerNonce,
      beneficiary,
      amountST,
      amountUT,
      unlockHeight,
      stakingIntentHash
    );
  }

};

new stakeAndMintInterComm();

logger.win("interComm initiated");
