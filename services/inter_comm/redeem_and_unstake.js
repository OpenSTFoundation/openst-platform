"use strict";

/**
 * This script is intermediate communicator between value chain and utility chain. Used for the redeem and unstake.
 *
 * <br>It listens to the openSTValue chain and respond to the openSTUtility chain.
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Set the processor on {@link module:lib/web3/events/queue_manager} </li>
 *   <li> It waits for the event StakingIntentDeclared Raised by stake method called on openSTValue. </li>
 *   <li> On the event arrival it initiate a task in the internal queue to run it with 6 blocks delay. </li>
 *   <li> When the task executes it run the processor passed on step1. </li>
 * </ol>
 *
 * @module services/inter_comm/redeem_and_unstake
 *
 */

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix + '/lib/web3/events/queue_manager')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3WsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')

  , openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')

  , openSTUtilityContractAbi = coreAddresses.getAbiForContract('openSTUtility')
  , openSTUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')

  , eventQueueManager = new eventQueueManagerKlass()
  , valueRegistrarAddr = coreAddresses.getAddressForUser('valueRegistrar')
  , valueRegistrarPassphrase = coreAddresses.getPassphraseForUser('valueRegistrar')

  , valueRegistrarContractAddress = coreAddresses.getAddressForContract("valueRegistrar")
  , valueRegistrarContractInteractKlass = require(rootPrefix + '/lib/contract_interact/value_registrar')
  , valueRegistrarContractInteract = new valueRegistrarContractInteractKlass(valueRegistrarContractAddress)
;

const redeemAndUnstakeInterComm = function () {
};


/**
 * Inter comm process for the redeem and unstake.
 * @namespace redeemAndUnstakeInterComm
 */
redeemAndUnstakeInterComm.prototype = {

  /**
   * Starts the process of the script with initializing processor
   * @memberOf redeemAndUnstakeInterComm
   */
  init: function () {
    var oThis = this;

    eventQueueManager.setProcessor(oThis.processor);
    oThis.bindEvents();
  },

  /**
   *
   * Bind to start listening the event RedemptionIntentDeclared
   *
   */
  bindEvents: function () {
    var oThis = this;
    logger.log("bindEvents binding RedemptionIntentDeclared");

    oThis.listenToRedemptionIntentDeclared(
      oThis.onEventSubscriptionError,
      oThis.onEvent,
      oThis.onEvent
    );

    logger.log("bindEvents done");
  },

  /**
   * Listening the event RedemptionIntentDeclared
   *
   * @param {function} onError - The method to run on error.
   * @param {function} onData - The method to run on success.
   * @param {function} onChange - The method to run on changed.
   *
   */
  listenToRedemptionIntentDeclared: function (onError, onData, onChange) {
    var completeContract = new web3WsProvider.eth.Contract(openSTUtilityContractAbi, openSTUtilityContractAddr);
    completeContract.setProvider(web3WsProvider.currentProvider);

    completeContract.events.RedemptionIntentDeclared({})
      .on('error', onError)
      .on('data', onData)
      .on('changed', onChange);
  },

  /**
   * to be executed in {@link module:lib/web3/events/queue_manager} when StakingIntentDeclared succeed.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  onEvent: function (eventObj) {
    eventQueueManager.addEditEventInQueue(eventObj);
  },

  /**
   * Generic Method to log event subscription error
   *
   * @param {Object} error - Object of event.
   *
   */
  onEventSubscriptionError: function (error) {
    logger.log("onEventSubscriptionError triggered");
    logger.error(error);
  },

  /**
   * Processor to be executed in {@link module:lib/web3/events/queue_manager} when StakingIntentDeclared succeed.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  processor: function (eventObj) {
    const returnValues = eventObj.returnValues
      , uuid = returnValues._uuid
      , redemptionIntentHash = returnValues._redemptionIntentHash
      , brandedTokenAddress = returnValues._token
      , redeemer = returnValues._redeemer
      , redeemerNonce = returnValues._nonce
      , amountUT = returnValues._amount
      , unlockHeight = returnValues._unlockHeight
      , chainIdValue = returnValues._chainIdValue
    ;

    return valueRegistrarContractInteract.confirmRedemptionIntent(
      valueRegistrarAddr,
      valueRegistrarPassphrase,
      openSTValueContractAddr,
      uuid,
      redeemer,
      redeemerNonce,
      amountUT,
      unlockHeight,
      redemptionIntentHash
    );
  }

};

new redeemAndUnstakeInterComm().init();

logger.win("InterComm Script for Stake and Mint initiated");
