"use strict";

/**
 * Deploy Simple Token Contract
 *
 * @module tools/setup/simple_token/deploy
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
  , MIN_FUND = (new BigNumber(10)).toPower(18);

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
    logger.step('** Foundation funding ETH on value chain to valueRegistrar');
    await setupFundManager.transferEth(foundationAddr, foundationPassphrase, valueRegistrarAddr, MIN_FUND.toString(10));

    logger.step('** Foundation funding ETH on value chain to valueDeployer');
    await setupFundManager.transferEth(foundationAddr, foundationPassphrase, valueDeployerAddr, MIN_FUND.toString(10));

    logger.step('** Foundation funding ETH on value chain to valueOps');
    await setupFundManager.transferEth(foundationAddr, foundationPassphrase, valueOpsAddr, MIN_FUND.toString(10));

    return Promise.resolve();
  }
};

module.exports = new FundUsersKlass();