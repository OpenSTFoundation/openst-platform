"use strict";

/**
 * This script is intermediate communicator between value chain and utility chain. Used for the stake and mint process.
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
 * @module services/inter_comm/stake_and_mint
 *
 */

const rootPrefix = '../..'
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix+'/lib/web3/events/queue_manager')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , web3WsProvider = require(rootPrefix+'/lib/web3/providers/value_ws')

  , openSTValueContractAbi = coreAddresses.getAbiForContract('openSTValue')
  , openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')

  , openSTUtilityCurrContractAddr = coreAddresses.getAddressForContract('openSTUtility')

  , eventQueueManager = new eventQueueManagerKlass()
  , utilityRegistrarAddr = coreAddresses.getAddressForUser('utilityRegistrar')
  , utilityRegistrarPassphrase = coreAddresses.getPassphraseForUser('utilityRegistrar')

  , utilityRegistrarContractAddress = coreAddresses.getAddressForContract("utilityRegistrar")
  , utilityRegistrarContractInteractKlass = require( rootPrefix + '/lib/contract_interact/utility_registrar' )
  , utilityRegistrarContractInteract = new utilityRegistrarContractInteractKlass(utilityRegistrarContractAddress)
  ;

const stakeAndMintInterComm = function() {};


/**
 * Inter comm process for the stake and mint.
 * @namespace stakeAndMintInterComm
 */
stakeAndMintInterComm.prototype = {

  /**
   * Starts the process of the script with initializing processor
   * @memberOf stakeAndMintInterComm
   */
  init: function () {
    var oThis = this;

    eventQueueManager.setProcessor(oThis.processor);
    oThis.bindEvents();
  },

  /**
   *
   * Bind to start listening the event stakingIntentDeclared
   *
   */
  bindEvents: function(){
    var oThis = this;
    logger.log("bindEvents binding StakingIntentDeclared");

    oThis.listenToStakingIntentDeclared(
      oThis.onEventSubscriptionError,
      oThis.onEvent,
      oThis.onEvent
    );

    logger.log("bindEvents done");
  },

  /**
   * Listening the event stakingIntentDeclared
   *
   * @param {function} onError - The method to run on error.
   * @param {function} onData - The method to run on success.
   * @param {function} onChange - The method to run on changed.
   *
   */
  listenToStakingIntentDeclared: function (onError, onData, onChange) {
    var completeContract = new web3WsProvider.eth.Contract( openSTValueContractAbi, openSTValueContractAddr );
    completeContract.setProvider(web3WsProvider.currentProvider);

    completeContract.events.StakingIntentDeclared({})
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
  onEvent: function ( eventObj ) {
    eventQueueManager.addEditEventInQueue(eventObj);
  },

  /**
   * Generic Method to log event subscription error
   *
   * @param {Object} error - Object of event.
   *
   */
  onEventSubscriptionError: function ( error ) {
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

    return utilityRegistrarContractInteract.confirmStakingIntent(
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
  }

};

new stakeAndMintInterComm().init();

logger.win("InterComm Script for Stake and Mint initiated");
