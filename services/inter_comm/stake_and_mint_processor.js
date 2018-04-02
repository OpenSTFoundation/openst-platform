"use strict";

/**
 * This service is intermediate communicator between value chain and utility chain used for process staking and process minting.
 *
 * <br>It listens to the StakingIntentConfirmed event emitted by confirmStakingIntent method of openSTUtility contract.
 * On getting this event, it calls processStaking method of openStValue contract
 * followed by calling processMinting method of openStUtility contract
 * followed by calling claim of branded token contract / simple token prime contract.
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> It scans for StakingIntentConfirmed event from openSTUtility contract in the blocks which were not scanned
 *   until now till the latest block minus 6th block. </li>
 *
 *   <li> When events are obtained, it processes the events one by one, in which it calls processStaking method of openStValue contract
 *   followed by calling processMinting method of openStUtility contract
 *   followed by calling claim of branded token contract / simple token prime contract.
 *
 *   When processing a single event from the array of events, it waits for the moment till
 *   transaction hash is obtained and then picks the next event for processing.</li>
 * </ol>
 *
 * @module services/inter_comm/stake_and_mint_processor
 */

const openSTNotification = require('@openstfoundation/openst-notification')
;

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , IntercomBaseKlass = require(rootPrefix + '/services/inter_comm/base')
;

/**
 * is equal ignoring case
 *
 * @param {string} compareWith - string to compare with
 *
 * @return {boolean} true when equal
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
 * @param {string} params.file_path - this is the file path for the data file
 *
 * @constructor
 * @augments IntercomBaseKlass
 *
 */
const StakeAndMintProcessorInterCommKlass = function (params) {
  const oThis = this
  ;

  IntercomBaseKlass.call(oThis, params);
};

StakeAndMintProcessorInterCommKlass.prototype = Object.create(IntercomBaseKlass.prototype);

const StakeAndMintProcessorInterCommKlassSpecificPrototype = {

  EVENT_NAME: 'StakingIntentConfirmed',

  /**
   * Set contract object for listening to events
   *
   */
  setContractObj: function () {
    const oThis = this
      , web3WsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
      , openSTUtilityContractAbi = coreAddresses.getAbiForContract('openSTUtility')
      , openSTUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')
    ;

    oThis.completeContract = new web3WsProvider.eth.Contract(openSTUtilityContractAbi, openSTUtilityContractAddr);
    //oThis.completeContract.setProvider(web3WsProvider.currentProvider);
  },

  /**
   * Get chain highest block
   *
   */
  getChainHighestBlock: async function () {
    const web3WsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
      , highestBlock = await web3WsProvider.eth.getBlockNumber()
    ;
    return highestBlock;
  },

  /**
   * Parallel processing allowed
   * @return bool
   */
  parallelProcessingAllowed: function() {
    return true;
  },

  /**
   * Process event object
   * @param {object} eventObj - event object
   */
  processEventObj: async function (eventObj) {
    const returnValues = eventObj.returnValues
      , stakingIntentHash = returnValues._stakingIntentHash
      , staker = returnValues._staker
      , beneficiary = returnValues._beneficiary
      , uuid = returnValues._uuid
      , stakerAddress = coreAddresses.getAddressForUser('staker')
      , stakerPassphrase = coreAddresses.getPassphraseForUser('staker')
      , StPrimeKlass = require(rootPrefix + '/lib/contract_interact/st_prime')
      , stPrimeContractAddress = coreAddresses.getAddressForContract('stPrime')
      , stPrime = new StPrimeKlass(stPrimeContractAddress)
      , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
      , openSTUtilityContractInteract = new OpenStUtilityKlass()
      , BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
      , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
      , openSTValueContractInteract = new OpenSTValueKlass()
    ;

    const notificationData = {
      topics: [],
      publisher: 'OST',
      message: {
        kind: '',
        payload: {
          status: '',
          staking_params: {
            stakingIntentHash: stakingIntentHash,
            staker: staker,
            beneficiary: beneficiary,
            uuid: uuid
          }
        }
      }
    };

    // do not perform any action if the stake was not done using the internal address.
    if (!stakerAddress.equalsIgnoreCase(staker)) {
      return Promise.resolve(responseHelper.successWithData({}));
    }

    // Pick either ST Prime or BT contract
    var utilityTokenInterfaceContract = null,
      displayTokenType = '';
    if (uuid.equalsIgnoreCase(coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID)) {
      utilityTokenInterfaceContract = stPrime;
      displayTokenType = 'ST Prime';
    } else {
      const registeredOnUCResult = await openSTUtilityContractInteract.registeredToken(uuid);
      utilityTokenInterfaceContract = new BrandedTokenKlass({ERC20: registeredOnUCResult.data.erc20Address});
      displayTokenType = 'Branded Token';
    }

    /**
     * processStaking
     */
    // Fire notification event
    notificationData.topics = ['event.stake_and_mint_processor.process_staking_on_vc.start'];
    notificationData.message.kind = 'info';
    openSTNotification.publishEvent.perform(notificationData);

    logger.step(stakingIntentHash, ' :: performing processStaking for ' + displayTokenType);

    const vcStakeResponse =  await openSTValueContractInteract.processStaking(stakerAddress, stakerPassphrase, stakingIntentHash);

    if (vcStakeResponse.isSuccess()) {
      const vcFormattedTransactionReceipt = vcStakeResponse.data.formattedTransactionReceipt
        , vcFormattedEvents = await web3EventsFormatter.perform(vcFormattedTransactionReceipt);

      // Fire notification event
      notificationData.topics = ['event.stake_and_mint_processor.process_staking_on_vc.done'];
      notificationData.message.kind = 'info';
      notificationData.message.payload.transaction_hash = vcFormattedTransactionReceipt.transactionHash;
      openSTNotification.publishEvent.perform(notificationData);

      logger.win(stakingIntentHash, ':: performed processStaking on openSTValue contract for ' + displayTokenType, vcFormattedEvents);
    } else {

      // Fire notification event
      notificationData.message.kind = 'error';
      notificationData.message.payload.error_data = vcStakeResponse;
      openSTNotification.publishEvent.perform(notificationData);

      var errMessage = stakingIntentHash + ' processStaking on openSTValue contract failed for ' + displayTokenType;
      logger.notify('e_ic_samp_processor_1', errMessage);

      return Promise.resolve(responseHelper.error('e_ic_samp_1', errMessage));
    }

    /**
     * processMinting
     */
    // Fire notification event
    notificationData.topics = ['event.stake_and_mint_processor.process_minting_on_uc.start'];
    notificationData.message.kind = 'info';
    openSTNotification.publishEvent.perform(notificationData);

    logger.step(stakingIntentHash, ' :: performing processMinting for ' + displayTokenType);

    const ucMintResponse = await openSTUtilityContractInteract.processMinting(stakerAddress, stakerPassphrase, stakingIntentHash);

    if (ucMintResponse.isSuccess()) {
      const ucFormattedTransactionReceipt = ucMintResponse.data.formattedTransactionReceipt
        , ucFormattedEvents = await web3EventsFormatter.perform(ucFormattedTransactionReceipt);

      // Fire notification event
      notificationData.topics = ['event.stake_and_mint_processor.process_minting_on_uc.done'];
      notificationData.message.kind = 'info';
      notificationData.message.payload.transaction_hash = ucFormattedTransactionReceipt.transactionHash;
      openSTNotification.publishEvent.perform(notificationData);

      logger.win(stakingIntentHash, ':: performed processMinting on openSTUtility contract for ' + displayTokenType, ucFormattedEvents);
    } else {

      // Fire notification event
      notificationData.message.kind = 'error';
      notificationData.message.payload.error_data = ucMintResponse;
      openSTNotification.publishEvent.perform(notificationData);

      var errMessage = stakingIntentHash + ' processMinting on openSTUtility contract failed for ' + displayTokenType;
      logger.notify('e_ic_samp_processor_2', errMessage);

      return Promise.resolve(responseHelper.error('e_ic_samp_2', errMessage));
    }

    /**
     * Claim
     */
    // Fire notification event
    notificationData.topics = ['event.stake_and_mint_processor.claim_token_on_uc.start'];
    notificationData.message.kind = 'info';
    openSTNotification.publishEvent.perform(notificationData);

    logger.step(stakingIntentHash, ' :: performing claim for ' + displayTokenType);

    const ucClaimResponse = await utilityTokenInterfaceContract.claim(stakerAddress, stakerPassphrase, beneficiary);

    if (ucClaimResponse.isSuccess()) {
      const ucFormattedTransactionReceipt = ucClaimResponse.data.formattedTransactionReceipt
        , ucFormattedEvents = await web3EventsFormatter.perform(ucFormattedTransactionReceipt);

      // Fire notification event
      notificationData.topics = ['event.stake_and_mint.claim_token_on_uc.done'];
      notificationData.message.kind = 'info';
      notificationData.message.payload.transaction_hash = ucFormattedTransactionReceipt.transactionHash;
      openSTNotification.publishEvent.perform(notificationData);

      logger.win(stakingIntentHash, ':: performed claim for ' + displayTokenType, ucFormattedEvents);
    } else {

      // Fire notification event
      notificationData.message.kind = 'error';
      notificationData.message.payload.error_data = ucClaimResponse;
      openSTNotification.publishEvent.perform(notificationData);

      var errMessage = stakingIntentHash + ' claim failed for ' + displayTokenType;
      logger.notify('e_ic_samp_processor_3', errMessage);

      return Promise.resolve(responseHelper.error('e_ic_samp_3', errMessage));
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }
};

Object.assign(StakeAndMintProcessorInterCommKlass.prototype, StakeAndMintProcessorInterCommKlassSpecificPrototype);

module.exports = StakeAndMintProcessorInterCommKlass;