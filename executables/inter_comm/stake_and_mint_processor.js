"use strict";

/**
 * This executable / script is intermediate communicator between value chain and utility chain used for process staking and process minting.
 *
 * <br>It listens to the StakingIntentConfirmed event emitted by confirmStakingIntent method of openSTUtility contract.
 * On getting this event, it calls processStaking method of openStValue contract
 * followed by calling processMinting method of openStUtility contract
 * followed by calling claim of branded token contract / simple token prime contract.
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Set the processor on {@link module:lib/web3/events/queue_manager|queue manager} </li>
 *   <li> It waits for the event StakingIntentConfirmed from openSTUtility contract. </li>
 *   <li> On the event arrival it initiate a task in the internal queue to run it with 6 blocks delay. </li>
 *   <li> When the task executes it run the processor passed on step1,
 *   in which it calls processStaking method of openStValue contract
 *   followed by calling processMinting method of openStUtility contract
 *   followed by calling claim of branded token contract / simple token prime contract.</li>
 * </ol>
 *
 * @module executables/inter_comm/stake_and_mint_processor
 *
 */

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix + '/lib/web3/events/queue_manager')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3WsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , openSTValueContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , openSTUtilityContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , BrandedTokenContractInteractKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
  , stPrimeKlass = require(rootPrefix + '/lib/contract_interact/st_prime')
;

const openSTUtilityContractAbi = coreAddresses.getAbiForContract('openSTUtility')
  , openSTUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , stPrimeContractAddress = coreAddresses.getAddressForContract("stPrime")
  , stPrime = new stPrimeKlass(stPrimeContractAddress)
  , eventQueueManager = new eventQueueManagerKlass()
  , openSTValueContractInteract = new openSTValueContractInteractKlass()
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass()
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
 * Inter comm process for stake and mint processing.
 *
 * @constructor
 *
 */
const StakeAndMintProcessorInterComm = function () {
};

StakeAndMintProcessorInterComm.prototype = {

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
    logger.log("bindEvents binding StakingIntentConfirmed");

    oThis.listenToDesiredEvent(
      oThis.onEventSubscriptionError,
      oThis.onEvent,
      oThis.onEvent
    );

    logger.log("bindEvents done");
  },

  /**
   * Listening StakingIntentConfirmed event emitted by confirmStakingIntent method of openSTUtility contract.
   *
   * @param {function} onError - The method to run on error.
   * @param {function} onData - The method to run on success.
   * @param {function} onChange - The method to run on changed.
   *
   */
  listenToDesiredEvent: function (onError, onData, onChange) {
    var completeContract = new web3WsProvider.eth.Contract(openSTUtilityContractAbi, openSTUtilityContractAddr);
    completeContract.setProvider(web3WsProvider.currentProvider);

    completeContract.events.StakingIntentConfirmed({})
      .on('error', onError)
      .on('data', onData)
      .on('changed', onChange);
  },

  /**
   * Processing of StakingIntentConfirmed event is delayed for n block confirmation by enqueueing to
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
   * every StakingIntentConfirmed event after waiting for n block confirmation.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  processor: async function (eventObj) {
    // TODO: Publish (event processing started and end result) to notify others
    const oThis = this
      , returnValues = eventObj.returnValues
      , stakingIntentHash = returnValues._stakingIntentHash
      , staker = returnValues._staker
      , beneficiary = returnValues._beneficiary
      , uuid = returnValues._uuid
    ;

    const stakerAddress = coreAddresses.getAddressForUser('staker')
      , stakerPassphrase = coreAddresses.getPassphraseForUser('staker');

    // do not perform any action if the stake was not done using the internal address.
    if (!stakerAddress.equalsIgnoreCase(staker)) {
      return Promise.resolve(responseHelper.error('e_ic_samp_1', 'staker is not same as the internal staker account.'));
    }

    logger.step(stakingIntentHash, ' :: performing processStaking');

    await openSTValueContractInteract.processStaking(
      stakerAddress,
      stakerPassphrase,
      stakingIntentHash
    );

    logger.win(stakingIntentHash, ' :: performed processStaking');
    logger.step(stakingIntentHash, ' :: performing processMinting');

    await openSTUtilityContractInteract.processMinting(
      stakerAddress,
      stakerPassphrase,
      stakingIntentHash
    );

    logger.win(stakingIntentHash, ' :: performed processMinting');

    logger.step(stakingIntentHash, ' :: performing claim');

    var utilityTokenInterfaceContract = null;

    if (uuid.equalsIgnoreCase(coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID)) {
      utilityTokenInterfaceContract = stPrime;
    } else {

      var registeredOnUCResult = await openSTUtilityContractInteract.registeredTokenProperty(uuid);

      utilityTokenInterfaceContract = new BrandedTokenContractInteractKlass({
        ERC20: registeredOnUCResult.data.erc20Address
      });
    }

    await utilityTokenInterfaceContract.claim(
      stakerAddress,
      stakerPassphrase,
      beneficiary
    );

    logger.win(stakingIntentHash, ' :: performed claim');

    return Promise.resolve(responseHelper.successWithData({staking_intent_hash: stakingIntentHash}));
  }

};

new StakeAndMintProcessorInterComm().init();

logger.win("InterComm Script for Stake and Mint Processor initiated.");
