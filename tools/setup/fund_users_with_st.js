"use strict";

/**
 * Fund the required users with ST for deployment
 *
 * @module tools/setup/fund_users_with_st
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = "../.."
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

require(rootPrefix + '/tools/setup/fund_manager');
require(rootPrefix + '/config/core_addresses');

/**
 * Fund the required users with ST for deployment - Constructor
 *
 * @constructor
 */
const FundUsersWithStKlass = function (configStrategy, instanceComposer) {

};

FundUsersWithStKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    
    const oThis = this
      , setupFundManager = oThis.ic().getSetupFundManager()
      , coreAddresses = oThis.ic().getCoreAddresses()
      , foundationAddr = coreAddresses.getAddressForUser('foundation')
      , foundationPassphrase = coreAddresses.getPassphraseForUser('foundation')
      , utilityChainOwnerAddr = coreAddresses.getAddressForUser('utilityChainOwner')
      , MIN_FUND = (new BigNumber(10)).toPower(18)
    ;
    
    logger.info('* Foundation funding ST on value chain to utilityChainOwner');
    await setupFundManager.transferST(
      foundationAddr, foundationPassphrase, utilityChainOwnerAddr, MIN_FUND.mul(100000000).toString(10),
      {tag: 'transferSTToUCOwner', returnType: 'txReceipt'}
    );
    
    return Promise.resolve();
  }
};

InstanceComposer.register(FundUsersWithStKlass, "getSetupFundUsersWithST", false);

module.exports = FundUsersWithStKlass;