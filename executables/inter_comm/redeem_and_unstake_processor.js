"use strict";

/**
 * This executable / script is intermediate communicator between value chain and utility chain used for process
 * redeem and unstake BT and ST'.
 *
 * <br>It listens to the RedemptionIntentConfirmed event emitted by confirmRedemptionIntent method of openSTValue contract.
 * On getting this event, it calls processRedeeming method of openStUtility contract
 * followed by calling processUnstaking method of openStValue contract
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Set the processor on {@link module:lib/web3/events/queue_manager|queue manager} </li>
 *   <li> It waits for the event RedemptionIntentConfirmed from openSTValue contract. </li>
 *   <li> On the event arrival it initiate a task in the internal queue to run it with 6 blocks delay. </li>
 *   <li> When the task executes it run the processor passed on step1,
 *   in which it calls processRedeeming method of openStUtility contract
 *   followed by calling processUnstaking method of openStValue contract</li>
 * </ol>
 *
 * @module executables/inter_comm/redeem_and_unstake_processor
 *
 */

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix + '/lib/web3/events/queue_manager')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3WsProvider = require(rootPrefix + '/lib/web3/providers/value_ws')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
;

const openSTValueContractAbi = coreAddresses.getAbiForContract('openSTValue')
  , openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
  , eventQueueManager = new eventQueueManagerKlass()
  , openSTValueContractInteract = new OpenSTValueKlass()
  , openSTUtilityContractInteract = new OpenStUtilityKlass()
;

/**
 * is equal ignoring case
 *
 * @param {String} compareWith - string to compare with
 *
 * @return {Bool} true when equal
 */
String.prototype.equalsIgnoreCase = function (compareWith) {
  var _self = this.toLowerCase()
    , _compareWith = String(compareWith).toLowerCase();

  return _self == _compareWith;
};

/**
 * Inter comm process for redeem and unstake processing.
 *
 * @constructor
 *
 */
const RedeemAndUnstakeProcessorInterComm = function () {
};

RedeemAndUnstakeProcessorInterComm.prototype = {

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
   *
   * Bind to start listening the desired event
   *
   */
  bindEvents: function () {
    var oThis = this;
    logger.log("bindEvents binding RedemptionIntentConfirmed");

    oThis.listenToDesiredEvent(
      oThis.onEventSubscriptionError,
      oThis.onEvent,
      oThis.onEvent
    );

    logger.log("bindEvents done");
  },

  /**
   * Listening RedemptionIntentConfirmed event emitted by confirmRedemptionIntent method of openSTValue contract.
   *
   * @param {function} onError - The method to run on error.
   * @param {function} onData - The method to run on success.
   * @param {function} onChange - The method to run on changed.
   *
   */
  listenToDesiredEvent: function (onError, onData, onChange) {
    var completeContract = new web3WsProvider.eth.Contract(openSTValueContractAbi, openSTValueContractAddr);
    completeContract.setProvider(web3WsProvider.currentProvider);

    completeContract.events.RedemptionIntentConfirmed({})
      .on('error', onError)
      .on('data', onData)
      .on('changed', onChange);
  },

  /**
   * Processing of RedemptionIntentConfirmed event is delayed for n block confirmation by enqueueing to
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
   * every RedemptionIntentConfirmed event after waiting for n block confirmation.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  processor: async function (eventObj) {
    // TODO: Publish (event processing started and end result) to notify others
    const oThis = this
      , returnValues = eventObj.returnValues
      , redemptionIntentHash = returnValues._redemptionIntentHash
      , redeemer = returnValues._redeemer
      , beneficiary = returnValues._beneficiary
      , uuid = returnValues._uuid
    ;

    const redeemerAddress = coreAddresses.getAddressForUser('redeemer')
      , redeemerPassphrase = coreAddresses.getPassphraseForUser('redeemer');

    // do not perform any action if the redeem was not done using the internal address.
    if (!redeemerAddress.equalsIgnoreCase(redeemer)) {
      return Promise.resolve(responseHelper.error('e_ic_raup_1', 'redeemer is not same as the internal redeemer account.'));
    }

    logger.step(redemptionIntentHash, ' :: performing processRedeeming');

    await openSTUtilityContractInteract.processRedeeming(
      redeemerAddress,
      redeemerPassphrase,
      redemptionIntentHash
    );

    logger.win(redemptionIntentHash, ' :: performed processRedeeming');
    logger.step(redemptionIntentHash, ' :: performing processUnstaking');

    await openSTValueContractInteract.processUnstaking(
      redeemerAddress,
      redeemerPassphrase,
      redemptionIntentHash
    );

    logger.win(redemptionIntentHash, ' :: performed processUnstaking');

    return Promise.resolve(responseHelper.successWithData({redemption_intent_hash: redemptionIntentHash}));
  }

};

new RedeemAndUnstakeProcessorInterComm().init();

logger.win("InterComm Script for Redeem and Unstake Processor initiated.");
