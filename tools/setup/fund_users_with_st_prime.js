"use strict";

/**
 * Fund the required users for deployment with ST prime
 *
 * @module tools/setup/fund_users
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = "../.."
  , setupFundManager = require(rootPrefix + '/lib/fund_manager')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const utilityChainOwnerAddr = coreAddresses.getAddressForUser('utilityChainOwner')
  , utilityChainOwnerPassphrase = coreAddresses.getPassphraseForUser('utilityChainOwner')
  , stakerAddr = coreAddresses.getAddressForUser('staker')
  , redeemerAddr = coreAddresses.getAddressForUser('redeemer')
  , utilityRegistrarAddr = coreAddresses.getAddressForUser('utilityRegistrar')
  , MIN_FUND = (new BigNumber(10)).toPower(18)
;

/**
 * Fund the required users for deployment with ST prime - constructor
 *
 * @constructor
 */
const FundUsersWithSTPrimeKlass = function () {
};

FundUsersWithSTPrimeKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
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

    return Promise.resolve();
  }
};

module.exports = new FundUsersWithSTPrimeKlass();