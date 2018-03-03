"use strict";

/**
 * This executable / script is intermediate communicator between value chain and utility chain used for the stake and mint.
 *
 * <br>It listens to the StakingIntentDeclared event emitted by stake method of openSTValue contract.
 * On getting this event, it calls confirmStakingIntent method of utilityRegistrar contract.
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> It scans for StakingIntentDeclared event in the blocks which were not scanned until now till the latest
 *   block minus 6th block.</li>
 *   <li> When events are obtained, it processes the events one by one, in which confirmStakingIntent method of
 *   utilityRegistrar contract is called. When processing a single event from the array of events, it waits for the moment till
 *   transaction hash is obtained and then picks the next event for processing.</li>
 * </ol>
 *
 * @module executables/inter_comm/stake_and_mint_bak
 *
 */

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , IntercomBaseKlass = require(rootPrefix + '/executables/inter_comm/base')
;

/**
 * Inter comm process for the stake and mint.
 *
 * @param {string} params.file_path - this is the file path for the data file
 *
 * @constructor
 * @augments IntercomBaseKlass
 *
 */
const StakeAndMintInterCommKlass = function (params) {
  const oThis = this
  ;

  IntercomBaseKlass.call(oThis, params);
};

StakeAndMintInterCommKlass.prototype = Object.create(IntercomBaseKlass.prototype);

const StakeAndMintInterCommKlassSpecificPrototype = {

  EVENT_NAME: 'StakingIntentDeclared',

  /**
   * Set contract object for listening to events
   *
   */
  setContractObj: function () {
    const oThis = this
      , web3WsProvider = require(rootPrefix + '/lib/web3/providers/value_ws')
      , openSTValueContractAbi = coreAddresses.getAbiForContract('openSTValue')
      , openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
    ;

    oThis.completeContract = new web3WsProvider.eth.Contract(openSTValueContractAbi, openSTValueContractAddr);
    oThis.completeContract.setProvider(web3WsProvider.currentProvider);
  },

  /**
   * Get chain highest block
   *
   */
  getChainHighestBlock: async function () {
    const web3WsProvider = require(rootPrefix + '/lib/web3/providers/value_ws')
      , highestBlock = await web3WsProvider.eth.getBlockNumber()
    ;
    return highestBlock;
  },

  /**
   * Process event object
   * @param {object} eventObj - event object
   */
  processEventObj: async function (eventObj) {
    const returnValues = eventObj.returnValues
      , uuid = returnValues._uuid
      , staker = returnValues._staker
      , stakerNonce = returnValues._stakerNonce
      , amountST = returnValues._amountST
      , amountUT = returnValues._amountUT
      , unlockHeight = returnValues._unlockHeight
      , stakingIntentHash = returnValues._stakingIntentHash
      , beneficiary = returnValues._beneficiary
      , chainIdUtility = returnValues._chainIdUtility
      , UtilityRegistrarKlass = require(rootPrefix + '/lib/contract_interact/utility_registrar')
      , utilityRegistrarContractAddress = coreAddresses.getAddressForContract("utilityRegistrar")
      , openSTUtilityCurrContractAddr = coreAddresses.getAddressForContract('openSTUtility')
      , utilityRegistrarAddr = coreAddresses.getAddressForUser('utilityRegistrar')
      , utilityRegistrarPassphrase = coreAddresses.getPassphraseForUser('utilityRegistrar')
      , utilityRegistrarContractInteract = new UtilityRegistrarKlass(utilityRegistrarContractAddress)
    ;

    const transactionHash = await utilityRegistrarContractInteract.confirmStakingIntent(
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
      stakingIntentHash,
      true
    );

    logger.info(stakingIntentHash, ':: transaction hash for confirmStakingIntent:', transactionHash);

    return Promise.resolve();
  }
};

Object.assign(StakeAndMintInterCommKlass.prototype, StakeAndMintInterCommKlassSpecificPrototype);

const args = process.argv
  , filePath = args[2]
;

const stakeAndMintInterCommObj = new StakeAndMintInterCommKlass({file_path: filePath});
stakeAndMintInterCommObj.registerInterruptSignalHandlers();
stakeAndMintInterCommObj.init();

logger.win("InterComm Script for Stake and Mint initiated.");
