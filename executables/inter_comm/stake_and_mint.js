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

const fs = require('fs');

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
;

/**
 * Inter comm process for the stake and mint.
 *
 * @param {string} params.file_path - this is the file path for the data file
 *
 * @constructor
 *
 */
const StakeAndMintInterCommKlass = function (params) {
  const oThis = this;

  oThis.filePath = params.file_path;
  oThis.fromBlock = 0;
  oThis.toBlock = 0;
  oThis.snmData = {};
  oThis.interruptSignalObtained = false;
};

StakeAndMintInterCommKlass.prototype = {

  registerInterruptSignalHandlers: function () {
    const oThis = this;

    process.on('SIGINT', function() {
      console.log("Received SIGINT, cancelling block scaning");
      oThis.interruptSignalObtained = true;
    });
    process.on('SIGTERM', function() {
      console.log("Received SIGTERM, cancelling block scaning");
      oThis.interruptSignalObtained = true;
    });
  },

  /**
   * Starts the process of the script with initializing processor
   *
   */
  init: function () {

    const clearCacheOfExpr = /(openst-platform\/config\/)|(openst-platform\/lib\/)/
    ;

    Object.keys(require.cache).forEach(function(key)
    {
      if (key.search(clearCacheOfExpr) !== -1) {
        delete require.cache[key];
      }
    });

    const oThis = this
      , web3WsProvider = require(rootPrefix + '/lib/web3/providers/value_ws')
      , openSTValueContractAbi = coreAddresses.getAbiForContract('openSTValue')
      , openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
    ;

    oThis.completeContract = new web3WsProvider.eth.Contract(openSTValueContractAbi, openSTValueContractAddr);
    oThis.completeContract.setProvider(web3WsProvider.currentProvider);

    // Read this from a file
    oThis.snmData = JSON.parse(fs.readFileSync(oThis.filePath).toString());

    oThis.checkForFurtherEvents();
  },

  /**
   * Check for further events
   *
   */
  checkForFurtherEvents: async function () {
    const oThis = this
    ;

    try {
      const web3WsProvider = require(rootPrefix + '/lib/web3/providers/value_ws')
        , highestBlock = await web3WsProvider.eth.getBlockNumber()
      ;

      // return if nothing more to do.
      if (highestBlock - 6 <= oThis.lastProcessedBlock) return oThis.schedule();

      // consider case in which last block was not processed completely

      oThis.fromBlock = oThis.snmData.lastProcessedBlock + 1;
      oThis.toBlock = highestBlock - 6;

      const events = await oThis.completeContract.getPastEvents(
        oThis.EVENT_NAME,
        {fromBlock: oThis.fromBlock, toBlock: oThis.toBlock},
        oThis.getPastEventsCallback
      );
      await oThis.processEventsArray(events);

      oThis.schedule();
    } catch(err) {
      logger.info('Exception got:', err);
      oThis.reInit();
    }
  },

  /**
   * Get past events call back function
   *
   */
  getPastEventsCallback: function (error, logs) {
    if (error) logger.error('getPastEvents error:', error);
    logger.log('getPastEvents done.');
  },

  /**
   * Process events array
   *
   * @param {array} events - events array
   *
   */
  processEventsArray: async function (events) {
    const oThis = this
    ;

    // nothing to do
    if (!events || events.length === 0) {
      oThis.updateIntercomDataFile();
      return Promise.resolve();
    }

    //TODO: last processed transaction index.
    for (var i = 0; i < events.length; i++) {
      const eventObj = events[i]
      ;

      await oThis.processEventObj(eventObj);
    }

    oThis.updateIntercomDataFile();
    return Promise.resolve();
  },

  /**
   * Schedule
   */
  schedule: function () {
    const oThis = this
    ;
    setTimeout(function () {
      oThis.checkForFurtherEvents();
    }, 5000);
  },

  /**
   * Re init
   */
  reInit: function () {
    const oThis = this
    ;
    setTimeout(function () {
      oThis.init();
    }, 5000);
  },

  /**
   * Update intercom data file
   */
  updateIntercomDataFile: function () {
    const oThis = this
    ;

    oThis.snmData.lastProcessedBlock = oThis.toBlock;

    fs.writeFileSync(
      oThis.filePath,
      JSON.stringify(oThis.snmData),
      function (err) {
        if (err)
          logger.error(err);
      }
    );

    console.log("Writtennnn. Fileee");

    if(oThis.interruptSignalObtained){
      console.log('Exiting Process....');
      process.exit(1);
    }
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
  },

  EVENT_NAME: 'StakingIntentDeclared'
};

const args = process.argv
  , filePath = args[2]
;


const stakeAndMintInterCommObj = new StakeAndMintInterCommKlass({file_path: filePath});
stakeAndMintInterCommObj.registerInterruptSignalHandlers();
stakeAndMintInterCommObj.init();

logger.win("InterComm Script for Stake and Mint initiated.");
