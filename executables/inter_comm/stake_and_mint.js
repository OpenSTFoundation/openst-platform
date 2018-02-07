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
;

const openSTValueContractAbi = coreAddresses.getAbiForContract('openSTValue')
  , openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
  , openSTUtilityCurrContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , utilityRegistrarAddr = coreAddresses.getAddressForUser('utilityRegistrar')
  , utilityRegistrarPassphrase = coreAddresses.getPassphraseForUser('utilityRegistrar')
  , utilityRegistrarContractAddress = coreAddresses.getAddressForContract("utilityRegistrar")
  , utilityRegistrarContractInteract = new UtilityRegistrarKlass(utilityRegistrarContractAddress)
  , eventQueueManager = new eventQueueManagerKlass()
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
    openSTNotification.publish_event.perform(
      {
        topic: 'event.StakingIntentDeclared',
        message: {
          kind: 'event_received',
          payload: {
            event_name: 'StakingIntentDeclared',
            params: eventObj.returnValues,
            contract_address: openSTValueContractAddr,
            chain_id: web3WsProvider.chainId,
            chain_kind: web3WsProvider.chainKind
          }
        }
      }
    );

    eventQueueManager.addEditEventInQueue(eventObj);
  },

  /**
   * Generic Method to log event subscription error
   *
   * @param {Object} error - Object of event.
   *
   */
  onEventSubscriptionError: function (error) {
    openSTNotification.publish_event.perform(
      {
        topic: 'error',
        message: {
          kind: 'error',
          payload: {
            text: error || '',
            code: 'e_ic_sam_onEventSubscriptionError_1'
          }
        }
      }
    );

    logger.error('onEventSubscriptionError triggered');
    logger.error(error);
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

    openSTNotification.publish_event.perform(
      {
        topic: 'staking.confirmStakingIntent.start',
        message: {
          kind: 'info',
          payload: {
            staking_intent_hash: stakingIntentHash
          }
        }
      }
    );

    logger.step(stakingIntentHash, ' :: performing confirmStakingIntent');

    await utilityRegistrarContractInteract.confirmStakingIntent(
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

    openSTNotification.publish_event.perform(
      {
        topic: 'staking.confirmStakingIntent.done',
        message: {
          kind: 'info',
          payload: {
            staking_intent_hash: stakingIntentHash
          }
        }
      }
    );

    logger.win(stakingIntentHash, ' :: performed confirmStakingIntent');

    return Promise.resolve();
  }

};

new StakeAndMintInterComm().init();

logger.win("InterComm Script for Stake and Mint initiated.");
