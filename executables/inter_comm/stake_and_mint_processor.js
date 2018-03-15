"use strict";

/**
 * This service is intermediate communicator between value chain and utility chain used for process staking and process minting.
 *
 * <br>It listens to the StakingIntentConfirmed event emitted by confirmStakingIntent method of openSTUtility contract.
 * On getting this event, it calls processStaking method of openStValue contract
 * followed by calling processMinting method of openStUtility contract
 * followed by calling claim of branded token contract / simple token prime contract.
 *
 * @module executables/inter_comm/stake_and_mint_processor
 */

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , StakeAndMintProcessorInterCommKlass = require(rootPrefix + '/services/inter_comm/stake_and_mint_processor')
;

const args = process.argv
  , filePath = args[2]
;

const stakeAndMintProcessorInterCommObj = new StakeAndMintProcessorInterCommKlass({file_path: filePath});
stakeAndMintProcessorInterCommObj.registerInterruptSignalHandlers();
stakeAndMintProcessorInterCommObj.init();

logger.win("InterComm Script for Stake and Mint Processor initiated.");
