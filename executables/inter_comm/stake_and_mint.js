"use strict";

/**
 * This executable / script is intermediate communicator between value chain and utility chain used for the stake and mint.
 *
 * <br>It listens to the StakingIntentDeclared event emitted by stake method of openSTValue contract.
 * On getting this event, it calls confirmStakingIntent method of utilityRegistrar contract.
 *
 * @module executables/inter_comm/stake_and_mint
 */

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
;

const args = process.argv
  , filePath = args[2]
  , configStrategyFilePath = args[3]
;

require(rootPrefix + '/services/inter_comm/stake_and_mint');

const configStrategy = configStrategyFilePath ? require(configStrategyFilePath) : require(setupHelper.configStrategyFilePath())
  , instanceComposer = new InstanceComposer(configStrategy)
  , StakeAndMintInterCommKlass = instanceComposer.getStakeAndMintInterCommService()
;

const stakeAndMintInterCommObj = new StakeAndMintInterCommKlass({file_path: filePath});
stakeAndMintInterCommObj.registerInterruptSignalHandlers();
stakeAndMintInterCommObj.init();

logger.win("InterComm Script for Stake and Mint initiated.");
