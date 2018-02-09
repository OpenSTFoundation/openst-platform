"use strict";

/**
 * This executable / script is intermediate communicator between value chain and utility chain used for the redeem and unstake.
 *
 * <br>It listens to the RedemptionIntentDeclared event emitted by redeem method of openSTUtility contract.
 * On getting this event, it calls confirmRedemptionIntent method of valueRegistrar contract.
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Set the processor on {@link module:lib/web3/events/queue_manager|queue manager} </li>
 *   <li> It waits for the event RedemptionIntentDeclared from openSTUtility contract. </li>
 *   <li> On the event arrival it initiate a task in the internal queue to run it with 6 blocks delay. </li>
 *   <li> When the task executes it run the processor passed on step1,
 *   in which confirmRedemptionIntent method of valueRegistrar contract is called. </li>
 * </ol>
 *
 * @module executables/inter_comm/redeem_and_unstake
 *
 */

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix + '/lib/web3/events/queue_manager')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3WsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , ValueRegistrarKlass = require(rootPrefix + '/lib/contract_interact/value_registrar')
;

const openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
  , openSTUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , valueRegistrarContractAddr = coreAddresses.getAddressForContract("valueRegistrar")
  , openSTUtilityContractAbi = coreAddresses.getAbiForContract('openSTUtility')
  , valueRegistrarAddr = coreAddresses.getAddressForUser('valueRegistrar')
  , valueRegistrarPassphrase = coreAddresses.getPassphraseForUser('valueRegistrar')
  , valueRegistrarContractInteract = new ValueRegistrarKlass(valueRegistrarContractAddr)
  , eventQueueManager = new eventQueueManagerKlass()
;

/**
 * Inter comm process for the redeem and unstake.
 *
 * @constructor
 *
 */
const RedeemAndUnstakeInterComm = function () {
};

RedeemAndUnstakeInterComm.prototype = {

  /**
   * Starts the process of the script with initializing processor
   *
   */
  init: function () {
    var oThis = this;

    eventQueueManager.setProcessor(oThis.processor);
    oThis.bindEvents();
  },

  /**
   * Bind to start listening the desired event
   *
   */
  bindEvents: function () {
    var oThis = this;
    logger.log("bindEvents binding RedemptionIntentDeclared");

    oThis.listenToDesiredEvent(
      oThis.onEventSubscriptionError,
      oThis.onEvent,
      oThis.onEvent
    );

    logger.win("Started listening RedemptionIntentDeclared event emitted by redeem method of openSTUtility contract.");
  },

  /**
   * Listening RedemptionIntentDeclared event emitted by redeem method of openSTUtility contract.
   *
   * @param {function} onError - The method to run on error.
   * @param {function} onData - The method to run on success.
   * @param {function} onChange - The method to run on changed.
   *
   */
  listenToDesiredEvent: function (onError, onData, onChange) {
    var completeContract = new web3WsProvider.eth.Contract(openSTUtilityContractAbi, openSTUtilityContractAddr);
    completeContract.setProvider(web3WsProvider.currentProvider);

    completeContract.events.RedemptionIntentDeclared({})
      .on('error', onError)
      .on('data', onData)
      .on('changed', onChange);
  },

  /**
   * Processing of RedemptionIntentDeclared event is delayed for n block confirmation by enqueueing to
   * {@link module:lib/web3/events/queue_manager|queue manager}.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  onEvent: function (eventObj) {
    // TODO: Publish (event received) to notify others
    eventQueueManager.addEditEventInQueue(eventObj);
  },

  /**
   * Generic Method to log event subscription error
   *
   * @param {Object} error - Object of event.
   *
   */
  onEventSubscriptionError: function (error) {
    // TODO: Publish (error) to notify others
    logger.log("onEventSubscriptionError triggered");
    logger.error(error);
  },

  /**
   * Processor gets executed from {@link module:lib/web3/events/queue_manager|queue manager} for
   * every RedemptionIntentDeclared event after waiting for n block confirmation.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  processor: function (eventObj) {
    // TODO: Publish (event processing started and end result) to notify others
    const returnValues = eventObj.returnValues
      , uuid = returnValues._uuid
      , redemptionIntentHash = returnValues._redemptionIntentHash
      , redeemer = returnValues._redeemer
      , redeemerNonce = returnValues._nonce
      , amountUT = returnValues._amount
      , unlockHeight = returnValues._unlockHeight
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

new RedeemAndUnstakeInterComm().init();

logger.win("InterComm Script for Redeem and Unstake initiated.");
