"use strict";

/**
 * This executable / script is intermediate communicator between value chain and utility chain used for the stake and mint.
 *
 * <br>It listens to the StakingIntentDeclared event emitted by stake method of openSTValue contract.
 * On getting this event, it calls confirmStakingIntent method of utilityRegistrar contract.
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Set the processor on {@link module:lib/web3/events/queue_manager|queue manager} </li>
 *   <li> It waits for the event StakingIntentDeclared from openSTValue contract. </li>
 *   <li> On the event arrival it initiate a task in the internal queue to run it with 6 blocks delay. </li>
 *   <li> When the task executes it run the processor passed on step1,
 *   in which confirmStakingIntent method of utilityRegistrar contract is called. </li>
 * </ol>
 *
 * @module executables/inter_comm/stake_and_mint
 *
 */

const openSTNotification = require('@openstfoundation/openst-notification')
;

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix + '/lib/web3/events/queue_manager')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3WsProvider = require(rootPrefix + '/lib/web3/providers/value_ws')
  , UtilityRegistrarKlass = require(rootPrefix + '/lib/contract_interact/utility_registrar')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
;

const openSTValueContractAbi = coreAddresses.getAbiForContract('openSTValue')
  , openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
  , openSTUtilityCurrContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , utilityRegistrarAddr = coreAddresses.getAddressForUser('utilityRegistrar')
  , utilityRegistrarPassphrase = coreAddresses.getPassphraseForUser('utilityRegistrar')
  , utilityRegistrarContractAddress = coreAddresses.getAddressForContract("utilityRegistrar")
  , utilityRegistrarContractInteract = new UtilityRegistrarKlass(utilityRegistrarContractAddress)
  , eventQueueManager = new eventQueueManagerKlass()
  , notificationData = {
    topics: ['event.stake_and_mint'], // override later: with every stage
    publisher: 'OST',
    message: {
      kind: '', // populate later: with every stage
      payload: {
      }
    }
  }
;

/**
 * Inter comm process for the stake and mint.
 *
 * @constructor
 *
 */
const StakeAndMintInterComm = function () {
};

StakeAndMintInterComm.prototype = {

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
    logger.log("bindEvents binding StakingIntentDeclared");

    oThis.listenToDesiredEvent(
      oThis.onEventSubscriptionError,
      oThis.onEvent,
      oThis.onEvent
    );

    logger.log("bindEvents done");
  },

  /**
   * Listening StakingIntentDeclared event emitted by stake method of openSTValue contract.
   *
   * @param {function} onError - The method to run on error.
   * @param {function} onData - The method to run on success.
   * @param {function} onChange - The method to run on changed.
   *
   */
  listenToDesiredEvent: function (onError, onData, onChange) {
    var completeContract = new web3WsProvider.eth.Contract(openSTValueContractAbi, openSTValueContractAddr);
    completeContract.setProvider(web3WsProvider.currentProvider);

    completeContract.events.StakingIntentDeclared({})
      .on('error', onError)
      .on('data', onData)
      .on('changed', onChange);
  },

  /**
   * Processing of StakingIntentDeclared event is delayed for n block confirmation by enqueueing to
   * {@link module:lib/web3/events/queue_manager|queue manager}.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  onEvent: function (eventObj) {
    // Fire notification event
    notificationData.topics = ['event.stake_and_mint.staking_intent_declared_on_vc'];
    notificationData.message.kind = 'event_received';
    notificationData.message.payload.event_name = 'StakingIntentDeclared';
    notificationData.message.payload.event_data = eventObj;
    openSTNotification.publishEvent.perform(notificationData);

    eventQueueManager.addEditEventInQueue(eventObj);
  },

  /**
   * Generic Method to log event subscription error
   *
   * @param {Object} error - Object of event.
   *
   */
  onEventSubscriptionError: function (error) {

    // Fire notification event
    notificationData.message.kind = 'error';
    notificationData.message.payload.error_data = error;
    openSTNotification.publishEvent.perform(notificationData);

    logger.notify('e_ic_sam_onEventSubscriptionError_1', 'onEventSubscriptionError triggered', error);
  },

  /**
   * Processor gets executed from {@link module:lib/web3/events/queue_manager|queue manager} for
   * every StakingIntentDeclared event after waiting for n block confirmation.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  processor: async function (eventObj) {
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
      , chainIdUtility = returnValues._chainIdUtility;

    // Fire notification event
    notificationData.topics = ['event.stake_and_mint.confirm_staking_intent_on_uc.start'];
    notificationData.message.kind = 'info';
    openSTNotification.publishEvent.perform(notificationData);

    logger.step(stakingIntentHash, ' :: performing confirmStakingIntent');

    const ucRegistrarResponse =  await utilityRegistrarContractInteract.confirmStakingIntent(
      utilityRegistrarAddr,
      utilityRegistrarPassphrase,
      openSTUtilityCurrContractAddr,
      uuid,
      staker,
      stakerNonce,
      beneficiary,
      amountST,
      amountUT,
      unlockHeight,
      stakingIntentHash
    );

    if (ucRegistrarResponse.isSuccess()) {
      const ucFormattedTransactionReceipt = ucRegistrarResponse.data.formattedTransactionReceipt
        , ucFormattedEvents = await web3EventsFormatter.perform(ucFormattedTransactionReceipt);

      // Fire notification event
      notificationData.topics = ['event.stake_and_mint.confirm_staking_intent_on_uc.done'];
      notificationData.message.kind = 'info';
      notificationData.message.payload.transaction_hash = ucFormattedTransactionReceipt.transactionHash;
      openSTNotification.publishEvent.perform(notificationData);

      logger.win(stakingIntentHash, ':: performed confirmStakingIntent of utilityRegistrar contract.', ucFormattedEvents);
    } else {

      // Fire notification event
      notificationData.message.kind = 'error';
      notificationData.message.payload.error_data = ucRegistrarResponse;
      openSTNotification.publishEvent.perform(notificationData);

      var errMessage = stakingIntentHash + ' confirmStakingIntent of utilityRegistrar contract ERROR. Something went wrong!';
      logger.notify('e_ic_sam_processor_1', errMessage);

      return Promise.reject(errMessage);
    }

    return Promise.resolve(ucRegistrarResponse);
  }

};

new StakeAndMintInterComm().init();

logger.win("InterComm Script for Stake and Mint initiated.");
