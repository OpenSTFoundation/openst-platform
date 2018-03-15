"use strict";

/**
 * Fund the required users with ST for deployment
 *
 * @module tools/setup/fund_users_with_st
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
  , utilityChainOwnerAddr = coreAddresses.getAddressForUser('utilityChainOwner')
  , MIN_FUND = (new BigNumber(10)).toPower(18)
;

/**
 * Fund the required users with ST for deployment - Constructor
 *
 * @constructor
 */
const FundUsersWithStKlass = function () {
};

FundUsersWithStKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    logger.info('* Foundation funding ST on value chain to utilityChainOwner');
    await setupFundManager.transferST(
        foundationAddr, foundationPassphrase, utilityChainOwnerAddr, MIN_FUND.mul(100000000).toString(10),
        {tag: 'transferSTToUCOwner', returnType: 'txReceipt'}
    );

    return Promise.resolve();
  }
};

module.exports = new FundUsersWithStKlass();