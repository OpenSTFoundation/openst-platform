"use strict";

/**
 * Fund the required users for deployment
 *
 * @module tools/setup/fund_users
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = "../.."
  , setupFundManager = require(rootPrefix + '/tools/setup/fund_manager')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const foundationAddr = coreAddresses.getAddressForUser('foundation')
  , foundationPassphrase = coreAddresses.getPassphraseForUser('foundation')
  , valueRegistrarAddr = coreAddresses.getAddressForUser('valueRegistrar')
  , valueDeployerAddr = coreAddresses.getAddressForUser('valueDeployer')
  , valueOpsAddr = coreAddresses.getAddressForUser('valueOps')
  , stakerAddr = coreAddresses.getAddressForUser('staker')
  , utilityChainOwnerAddr = coreAddresses.getAddressForUser('utilityChainOwner')
  , MIN_FUND = (new BigNumber(10)).toPower(18)
;

/**
 * Constructor for Deploy simple token contract
 *
 * @constructor
 */
const FundUsersKlass = function () {
};

FundUsersKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
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

module.exports = new FundUsersKlass();