"use strict";

/**
 * Fund the required users for deployment
 *
 * @module tools/setup/fund_users
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = "../.."
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/tools/setup/fund_manager');


/**
 * Fund the required users for deployment - Constructor
 *
 * @constructor
 */
const FundUsersKlass = function (configStrategy, instanceComposer) {
};

FundUsersKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    const oThis = this
      , coreAddresses = oThis.ic().getCoreAddresses()
      , setupFundManager = oThis.ic().getSetupFundManager()
      , foundationAddr = coreAddresses.getAddressForUser('foundation')
      , foundationPassphrase = coreAddresses.getPassphraseForUser('foundation')
      , valueRegistrarAddr = coreAddresses.getAddressForUser('valueRegistrar')
      , valueDeployerAddr = coreAddresses.getAddressForUser('valueDeployer')
      , valueOpsAddr = coreAddresses.getAddressForUser('valueOps')
      , stakerAddr = coreAddresses.getAddressForUser('staker')
      , utilityChainOwnerAddr = coreAddresses.getAddressForUser('utilityChainOwner')
      , MIN_FUND = (new BigNumber(10)).toPower(18)
    ;

    logger.info('* Foundation funding ETH on value chain to valueRegistrar');
    await setupFundManager.transferEth(foundationAddr, foundationPassphrase, valueRegistrarAddr, MIN_FUND.toString(10));

    logger.info('* Foundation funding ETH on value chain to valueDeployer');
    await setupFundManager.transferEth(foundationAddr, foundationPassphrase, valueDeployerAddr, MIN_FUND.toString(10));

    logger.info('* Foundation funding ETH on value chain to valueOps');
    await setupFundManager.transferEth(foundationAddr, foundationPassphrase, valueOpsAddr, MIN_FUND.toString(10));

    logger.info('* Foundation funding ETH on value chain to utility chain owner');
    await setupFundManager.transferEth(foundationAddr, foundationPassphrase, utilityChainOwnerAddr, MIN_FUND.mul(100000).toString(10));

    logger.info('* Foundation funding ETH on value chain to staker');
    await setupFundManager.transferEth(foundationAddr, foundationPassphrase, stakerAddr, MIN_FUND.mul(100000).toString(10));

    return Promise.resolve();
  }
};

InstanceComposer.register(FundUsersKlass, "getSetupFundUsers", false);

module.exports = FundUsersKlass;