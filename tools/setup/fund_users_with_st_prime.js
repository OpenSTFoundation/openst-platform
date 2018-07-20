"use strict";

/**
 * Fund the required users for deployment with ST prime
 *
 * @module tools/setup/fund_users
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = "../.."
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

require(rootPrefix + '/tools/setup/fund_manager');
require(rootPrefix + '/config/core_addresses');

/**
 * Fund the required users for deployment with ST prime - constructor
 *
 * @constructor
 */
const FundUsersWithSTPrimeKlass = function ( configStrategy, instanceComposer) {

};

FundUsersWithSTPrimeKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    
    const oThis = this
      , setupFundManager = oThis.ic().getSetupFundManager()
      , coreAddresses = oThis.ic().getCoreAddresses()
      , utilityChainOwnerAddr = coreAddresses.getAddressForUser('utilityChainOwner')
      , utilityChainOwnerPassphrase = coreAddresses.getPassphraseForUser('utilityChainOwner')
      , stakerAddr = coreAddresses.getAddressForUser('staker')
      , redeemerAddr = coreAddresses.getAddressForUser('redeemer')
      , utilityRegistrarAddr = coreAddresses.getAddressForUser('utilityRegistrar')
      , utilityOpsAddr = coreAddresses.getAddressForUser('utilityOps')
      , utilityDeployerAddr = coreAddresses.getAddressForUser('utilityDeployer')
      , MIN_FUND = (new BigNumber(10)).toPower(18)
    ;
    
    logger.info('* Funding required users with ST\'');
    logger.info('* Utility Chain Owner funding ST\' on utility chain to staker');
    await setupFundManager.transferSTP(utilityChainOwnerAddr, utilityChainOwnerPassphrase, stakerAddr,
      MIN_FUND.mul(100).toString(10));

    logger.info('* Utility Chain Owner funding ST\' on utility chain to redeemer');
    await setupFundManager.transferSTP(utilityChainOwnerAddr, utilityChainOwnerPassphrase, redeemerAddr,
      MIN_FUND.mul(100).toString(10));

    logger.info('* Utility Chain Owner funding ST\' on utility chain to utilityRegistrar');
    await setupFundManager.transferSTP(utilityChainOwnerAddr, utilityChainOwnerPassphrase, utilityRegistrarAddr,
      MIN_FUND.mul(100).toString(10));

    logger.info('* Utility Chain Owner funding ST\' on utility chain to utilityOps');
    await setupFundManager.transferSTP(utilityChainOwnerAddr, utilityChainOwnerPassphrase, utilityOpsAddr,
      MIN_FUND.mul(100).toString(10));

    logger.info('* Utility Chain Owner funding ST\' on utility chain to utilityDeployer');
    await setupFundManager.transferSTP(utilityChainOwnerAddr, utilityChainOwnerPassphrase, utilityDeployerAddr,
      MIN_FUND.mul(100).toString(10));

    return Promise.resolve();
    
  }
  
};

InstanceComposer.register(FundUsersWithSTPrimeKlass, "getSetupFundUsersWithSTPrime", false);

module.exports = FundUsersWithSTPrimeKlass;