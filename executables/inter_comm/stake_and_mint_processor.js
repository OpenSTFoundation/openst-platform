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

const openSTNotification = require('@openstfoundation/openst-notification')
;

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix + '/lib/web3/events/queue_manager')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3WsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
  , StPrimeKlass = require(rootPrefix + '/lib/contract_interact/st_prime')
;

const openSTUtilityContractAbi = coreAddresses.getAbiForContract('openSTUtility')
  , openSTUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , stPrimeContractAddress = coreAddresses.getAddressForContract('stPrime')
  , stPrime = new StPrimeKlass(stPrimeContractAddress)
  , eventQueueManager = new eventQueueManagerKlass()
  , openSTValueContractInteract = new OpenSTValueKlass()
  , openSTUtilityContractInteract = new OpenStUtilityKlass()
;

/**
 * is equal ignoring case
 *
 * @param {string} compareWith - string to compare with
 *
 * @return {booelan} true when equal
 */
String.prototype.equalsIgnoreCase = function ( compareWith ) {
  const oThis = this
    , _self = this.toLowerCase()
    , _compareWith = String( compareWith ).toLowerCase();

  return _self === _compareWith;
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
    openSTNotification.publish_event.perform(
      {
        topics: ['event.StakingIntentConfirmed'],
        message: {
          kind: 'event_received',
          payload: {
            event_name: 'StakingIntentConfirmed',
            params: eventObj.returnValues,
            contract_address: openSTUtilityContractAddr,
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
        topics: ['error'],
        message: {
          kind: 'error',
          payload: {
            text: error || '',
            code: 'e_ic_samp_onEventSubscriptionError_1'
          }
        }
      }
    );

    logger.error('onEventSubscriptionError triggered');
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

    openSTNotification.publish_event.perform(
      {
        topics: ['staking.processStaking.start'],
        message: {
          kind: 'info',
          payload: {
            staking_intent_hash: stakingIntentHash
          }
        }
      }
    );

    logger.step(stakingIntentHash, ' :: performing processStaking');

    await openSTValueContractInteract.processStaking(
      stakerAddress,
      stakerPassphrase,
      stakingIntentHash
    );

    openSTNotification.publish_event.perform(
      {
        topics: ['staking.processStaking.done'],
        message: {
          kind: 'info',
          payload: {
            staking_intent_hash: stakingIntentHash
          }
        }
      }
    );

    logger.win(stakingIntentHash, ' :: performed processStaking');

    openSTNotification.publish_event.perform(
      {
        topics: ['staking.processMinting.start'],
        message: {
          kind: 'info',
          payload: {
            staking_intent_hash: stakingIntentHash
          }
        }
      }
    );

    logger.step(stakingIntentHash, ' :: performing processMinting');

    await openSTUtilityContractInteract.processMinting(
      stakerAddress,
      stakerPassphrase,
      stakingIntentHash
    );

    openSTNotification.publish_event.perform(
      {
        topics: ['staking.processMinting.done'],
        message: {
          kind: 'info',
          payload: {
            staking_intent_hash: stakingIntentHash
          }
        }
      }
    );

    logger.win(stakingIntentHash, ' :: performed processMinting');

    var utilityTokenInterfaceContract = null;

    if (uuid.equalsIgnoreCase(coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID)) {
      utilityTokenInterfaceContract = stPrime;
    } else {

      const registeredOnUCResult = await openSTUtilityContractInteract.registeredToken(uuid);

      utilityTokenInterfaceContract = new BrandedTokenKlass({
        ERC20: registeredOnUCResult.data.erc20Address
      });
    }

    openSTNotification.publish_event.perform(
      {
        topics: ['staking.claim.start'],
        message: {
          kind: 'info',
          payload: {
            staking_intent_hash: stakingIntentHash
          }
        }
      }
    );

    logger.step(stakingIntentHash, ' :: performing claim');

    await utilityTokenInterfaceContract.claim(
      stakerAddress,
      stakerPassphrase,
      beneficiary
    );

    openSTNotification.publish_event.perform(
      {
        topics: ['staking.claim.done'],
        message: {
          kind: 'info',
          payload: {
            staking_intent_hash: stakingIntentHash
          }
        }
      }
    );

    logger.win(stakingIntentHash, ' :: performed claim');

    return Promise.resolve(responseHelper.successWithData({staking_intent_hash: stakingIntentHash}));
  }

};

new StakeAndMintProcessorInterComm().init();

logger.win("InterComm Script for Stake and Mint Processor initiated.");
