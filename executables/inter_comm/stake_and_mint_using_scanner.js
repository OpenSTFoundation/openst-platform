"use strict";

const fs = require('fs');

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
;

const openSTValueContractAbi = coreAddresses.getAbiForContract('openSTValue')
  , openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
  , openSTUtilityCurrContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , utilityRegistrarAddr = coreAddresses.getAddressForUser('utilityRegistrar')
  , utilityRegistrarPassphrase = coreAddresses.getPassphraseForUser('utilityRegistrar')
  , utilityRegistrarContractAddress = coreAddresses.getAddressForContract("utilityRegistrar")
;

/**
 * Inter comm process for the stake and mint.
 *
 * @constructor
 *
 */
const StakeAndMintInterCommUsingScannerKlass = function (params) {
  const oThis = this;

  oThis.filePath = params.file_path;
  oThis.fromBlock = 0;
  oThis.toBlock = 0;
  oThis.snmData = {}
};

StakeAndMintInterCommUsingScannerKlass.prototype = {
  init: function () {

    const clearCacheOfExpr = /(openst-platform\/config\/)|(openst-platform\/lib\/)/
    Object.keys(require.cache).forEach(function(key)
    {
      if (key.search(clearCacheOfExpr) !== -1) {
        delete require.cache[key];
      }
    });


    const oThis = this
      , web3WsProvider = require(rootPrefix + '/lib/web3/providers/value_ws')
    ;

    oThis.completeContract = new web3WsProvider.eth.Contract(openSTValueContractAbi, openSTValueContractAddr);
    oThis.completeContract.setProvider(web3WsProvider.currentProvider);

    // Read this from a file
    oThis.snmData = JSON.parse(fs.readFileSync(oThis.filePath).toString());

    console.log('oThis.snmData', oThis.snmData.lastProcessedBlock);

    oThis.checkForFurtherEvents();
  },

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

  getPastEventsCallback: function (error, logs) {
    if (error) logger.error('getPastEvents error:', error);
    logger.log('getPastEvents done.');
  },

  processEventsArray: async function (events) {
    const oThis = this
    ;

    // nothing to do
    if (!events || events.length === 0) {
      oThis.updateSnmDataFile();
      return Promise.resolve();
    }

    //TODO: last processed transaction index.
    for (var i = 0; i < events.length; i++) {
      const eventObj = events[i]
      ;

      await oThis.processEventObj(eventObj);
    }

    oThis.updateSnmDataFile();
    return Promise.resolve();
  },

  schedule: function () {
    const oThis = this
    ;
    setTimeout(function () {
      oThis.checkForFurtherEvents();
    }, 5000);
  },

  reInit: function () {
    const oThis = this
    ;
    setTimeout(function () {
      oThis.init();
    }, 5000);
  },

  updateSnmDataFile: function () {
    const oThis = this
    ;

    oThis.snmData.lastProcessedBlock = oThis.toBlock;

    fs.writeFileSync(
      oThis.filePath,
      JSON.stringify(oThis.snmData),
      function (err) {
        if (err)
          console.log(err);
      }
    );
  },

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

new StakeAndMintInterCommUsingScannerKlass({file_path: filePath}).init();

logger.win("InterComm Script for Stake and Mint initiated.");
