"use strict";

/**
 * This executable / script is intermediate communicator between value chain and utility chain used for
 * calling process staking if NOT called before process minting is called.
 *
 * <br>It listens to the ProcessedMint event emitted by processMinting method of openSTUtility contract.
 * On getting this event, it calls processStaking method of openSTValue contract if not called already.
 *
 * @module executables/inter_comm/stake_hunter
 */

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , StakeHunterInterCommKlass = require(rootPrefix + '/services/inter_comm/stake_hunter')
;

const args = process.argv
  , filePath = args[2]
;

const stakeHunterInterCommObj = new StakeHunterInterCommKlass({file_path: filePath});
stakeHunterInterCommObj.registerInterruptSignalHandlers();
stakeHunterInterCommObj.init();

logger.win("InterComm Script for Stake Hunter initiated.");
